import { base, type Bundle, type Selection, validateBundle } from '../domain/model';
import { diagnose } from '../domain/diagnostics';
import { projectGraph, type Lens } from '../domain/projections';
import { restoreKeepingProse } from '../domain/operations';
import { cloneJson as clone } from '../domain/clone';

export class Workspace {
  bundle = $state<Bundle>();
  selection = $state<Selection | null>(null);
  edgeSelection = $state<string | null>(null);
  lens = $state<Lens>('narrative');
  parentId = $state<string | null>(null);
  at = $state(1);
  atOrder = $state(Infinity);
  temporal = $state(true);
  threadIds = $state<string[]>([]);
  detail = $state(2);
  saveState = $state<'saved' | 'pending' | 'saving' | 'error'>('saved');
  message = $state('');
  error = $state('');
  recovery = $state<Bundle | null>(null);
  private undoStack: { restore: Bundle; from: Bundle }[] = [];
  private redoStack: { restore: Bundle; from: Bundle }[] = [];
  historyVersion = $state(0);
  private revision = 0;
  private generation = 0;
  private timer: ReturnType<typeof setTimeout> | undefined;
  private saving: Promise<void> | undefined;
  get canUndo() {
    return this.historyVersion >= 0 && this.undoStack.length > 0;
  }
  get canRedo() {
    return this.historyVersion >= 0 && this.redoStack.length > 0;
  }
  get issues() {
    return this.bundle ? diagnose(this.bundle) : [];
  }
  get graph() {
    return this.bundle
      ? projectGraph(this.bundle, {
          lens: this.lens,
          at: this.at,
          atOrder: this.atOrder,
          temporal: this.temporal,
          parentId: this.parentId,
          threadIds: this.threadIds,
          detail: this.detail
        })
      : { nodes: [], edges: [] };
  }
  load(b: Bundle) {
    this.bundle = b;
    this.revision = b.project.revision;
    this.parentId = b.units.find((u) => u.type === 'act' && u.parentId === null)?.id ?? null;
    let stored: string | null;
    try {
      stored = localStorage.getItem(`storygraph:draft:${b.project.id}`);
    } catch {
      this.error = 'Browser recovery storage is unavailable. Database autosave is still active.';
      return;
    }
    const recoveryKey = `storygraph:recovery:${b.project.id}`;
    if (!stored) {
      const recovery = localStorage.getItem(recoveryKey);
      if (recovery)
        try {
          this.recovery = validateBundle(JSON.parse(recovery));
        } catch {
          this.error = 'The browser recovery copy could not be read.';
        }
    }
    if (stored)
      try {
        const draft = validateBundle(JSON.parse(stored));
        if (draft.project.revision === b.project.revision) {
          this.bundle = draft;
          this.changed();
          this.message = 'Recovered your pending local draft.';
        } else {
          this.recovery = draft;
          localStorage.setItem(`storygraph:recovery:${b.project.id}`, JSON.stringify(draft));
          localStorage.removeItem(`storygraph:draft:${b.project.id}`);
        }
      } catch {
        this.error = 'A local recovery draft could not be read. The saved database copy is open.';
      }
  }
  mutate(action: (b: Bundle) => void, description = 'Changes saved', history = true) {
    if (!this.bundle) return;
    this.error = '';
    const previous = clone(this.bundle);
    const next = clone(this.bundle);
    try {
      action(next);
      validateBundle(next);
    } catch (e) {
      this.error = e instanceof Error ? e.message : 'This change could not be applied.';
      return;
    }
    if (history) {
      this.undoStack.push({ restore: previous, from: next });
      if (this.undoStack.length > 50) this.undoStack.shift();
      this.redoStack = [];
      this.historyVersion++;
    }
    this.bundle = next;
    this.threadIds = this.threadIds.filter((id) => next.threads.some((t) => t.id === id));
    this.message = description;
    this.changed();
  }
  private changed() {
    this.generation++;
    this.saveState = 'pending';
    this.cache();
    clearTimeout(this.timer);
    this.timer = setTimeout(() => void this.flush(), 500);
  }
  private cache() {
    try {
      if (this.bundle) {
        this.bundle.project.revision = this.revision;
        localStorage.setItem(
          `storygraph:draft:${this.bundle.project.id}`,
          JSON.stringify(this.bundle)
        );
      }
    } catch {
      this.error =
        'Browser recovery storage is full. Keep this tab open until the database save completes.';
    }
  }
  undo() {
    if (!this.bundle) return;
    const previous = this.undoStack.pop();
    if (!previous) return;
    this.redoStack.push({ restore: clone(this.bundle), from: previous.restore });
    this.bundle = restoreKeepingProse(previous.restore, clone(this.bundle), previous.from);
    this.historyVersion++;
    this.message = 'Change undone';
    this.changed();
  }
  redo() {
    if (!this.bundle) return;
    const next = this.redoStack.pop();
    if (!next) return;
    this.undoStack.push({ restore: clone(this.bundle), from: next.restore });
    this.bundle = restoreKeepingProse(next.restore, clone(this.bundle), next.from);
    this.historyVersion++;
    this.message = 'Change restored';
    this.changed();
  }
  async flush(): Promise<void> {
    clearTimeout(this.timer);
    if (this.saving) {
      await this.saving;
      if (this.saveState === 'pending') return this.flush();
      return;
    }
    if (!this.bundle || this.saveState === 'saved') return;
    const generation = this.generation;
    const snapshot = clone(this.bundle);
    this.saveState = 'saving';
    this.saving = (async () => {
      try {
        const response = await fetch(`/api/projects/${snapshot.project.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bundle: snapshot, revision: this.revision })
        });
        const result: unknown = await response.json();
        if (!response.ok)
          throw new Error(
            typeof result === 'object' && result !== null && 'message' in result
              ? String(result.message)
              : 'Save failed. Your pending work is kept in this browser.'
          );
        const saved = validateBundle(result);
        this.revision = saved.project.revision;
        if (this.bundle) {
          this.bundle.project.revision = this.revision;
          this.bundle.project.updatedAt = saved.project.updatedAt;
        }
        this.error = '';
        this.saveState = generation === this.generation ? 'saved' : 'pending';
        if (this.saveState === 'saved')
          localStorage.removeItem(`storygraph:draft:${snapshot.project.id}`);
        else this.cache();
      } catch (e) {
        this.error =
          e instanceof Error ? e.message : 'Unable to save. Your draft is preserved locally.';
        this.saveState = 'error';
        this.cache();
      }
    })();
    await this.saving;
    this.saving = undefined;
    if (this.generation !== generation && !this.error) return this.flush();
  }
  setLayout(id: string, x: number, y: number) {
    const lens = `${this.lens}:${this.parentId ?? 'root'}`;
    this.mutate((b) => {
      const layout = b.layouts.find((l) => l.objectId === id && l.lens === lens);
      if (layout) {
        layout.x = x;
        layout.y = y;
      } else b.layouts.push({ ...base(), lens, objectId: id, x, y });
    }, 'Canvas position saved');
  }
  select(selection: Selection) {
    this.edgeSelection = null;
    this.selection = selection;
    if (selection.kind === 'unit') {
      const u = this.bundle?.units.find((u) => u.id === selection.id);
      this.atOrder = Infinity;
      if (u?.storyTime !== null && u?.storyTime !== undefined) this.at = u.storyTime;
    }
  }
  navigate(selection: Selection) {
    this.select(selection);
    if (selection.kind === 'unit') {
      this.lens = 'narrative';
      this.parentId = this.bundle?.units.find((u) => u.id === selection.id)?.parentId ?? null;
    } else if (selection.kind === 'entity' || selection.kind === 'relationship')
      this.lens = selection.kind === 'entity' ? 'world' : 'relationships';
  }
  dispose() {
    clearTimeout(this.timer);
  }
}
