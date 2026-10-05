import { describe, it, expect, afterEach } from 'vitest';
import { openDatabase } from '../src/lib/server/db';
import { ProjectRepository, ConflictError } from '../src/lib/server/repository';
import { demoProject } from '../src/lib/domain/demo';
import { base, unitSchema, collections, type Bundle } from '../src/lib/domain/model';
import { cloneProject } from '../src/lib/domain/operations';
import { siblings, placeUnit } from '../src/lib/domain/order';
const connections: ReturnType<typeof openDatabase>[] = [];
afterEach(() => {
  for (const c of connections) c.sqlite.close();
  connections.length = 0;
});
const setup = () => {
  const c = openDatabase(':memory:');
  connections.push(c);
  return { repo: new ProjectRepository(c), c };
};
describe('transactional SQLite persistence', () => {
  it('persists every domain collection, prose, relationship history, and changes', () => {
    const { repo } = setup();
    const b = repo.save(demoProject(), null);
    const normalize = (value: Bundle) => ({
      ...value,
      ...Object.fromEntries(
        collections.map((key) => [key, [...value[key]].sort((a, c) => a.id.localeCompare(c.id))])
      )
    });
    expect(normalize(repo.load(b.project.id)!)).toEqual(normalize(b));
    expect(repo.list()).toHaveLength(1);
  });
  it('persists insertion and reordering independently of chronology', () => {
    const { repo } = setup();
    const b = repo.save(demoProject(), null);
    const list = siblings(b, b.units[0].id);
    const unit = unitSchema.parse({ ...base(), title: 'Between', rank: 0, storyTime: 20 });
    b.units.push(unit);
    placeUnit(b, unit.id, list[0].parentId, list[1].id);
    const saved = repo.save(b, b.project.revision);
    const loaded = repo.load(b.project.id)!;
    expect(siblings(loaded, list[0].parentId)[1].title).toBe('Between');
    expect(loaded.units.find((u) => u.id === unit.id)?.storyTime).toBe(20);
    expect(saved.project.revision).toBe(1);
  });
  it('rejects stale saves without modifying any existing records', () => {
    const { repo } = setup();
    const b = repo.save(demoProject(), null);
    const original = structuredClone(b);
    b.project.title = 'New title';
    repo.save(b, 0);
    expect(() => repo.save(original, 0)).toThrow(ConflictError);
    expect(repo.load(b.project.id)?.project.title).toBe('New title');
  });
  it('exports, deletes, and imports a complete project with all references preserved', () => {
    const { repo } = setup();
    const b = repo.save(demoProject(), null);
    const exported = JSON.stringify(b);
    repo.delete(b.project.id);
    expect(repo.list()).toHaveLength(0);
    const imported = repo.save(cloneProject(JSON.parse(exported), b.project.title), null);
    const result = repo.load(imported.project.id)!;
    expect(result.relationshipStates.map((s) => s.label)).toEqual(
      b.relationshipStates.map((s) => s.label)
    );
    expect(result.documents[0].text).toBe(b.documents[0].text);
    expect(result.units.map((u) => u.storyTime).sort()).toEqual(
      b.units.map((u) => u.storyTime).sort()
    );
  });
  it('enforces foreign keys at the storage boundary', () => {
    const { c } = setup();
    expect(() =>
      c.sqlite
        .prepare('INSERT INTO objects (id,project_id,kind) VALUES (?,?,?)')
        .run(crypto.randomUUID(), crypto.randomUUID(), 'entity')
    ).toThrow();
  });
  it('applies migrations idempotently to existing databases', () => {
    const { c } = setup();
    expect(c.sqlite.prepare('SELECT count(*) AS count FROM __drizzle_migrations').get()).toEqual({
      count: 1
    });
  });
});
