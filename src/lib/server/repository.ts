import { eq } from 'drizzle-orm';
import { database, type openDatabase } from './db';
import * as tables from './schema';
import { validateBundle, collections, type Bundle } from '../domain/model';

export class ConflictError extends Error {}
export class ProjectRepository {
  constructor(private connection: ReturnType<typeof openDatabase> = database()) {}
  list() { return this.connection.db.select().from(tables.projects).all().map((p) => ({ id:p.id,title:p.title,description:p.description,updatedAt:p.updatedAt })); }
  load(id: string): Bundle | undefined {
    const db = this.connection.db; const project = db.select().from(tables.projects).where(eq(tables.projects.id,id)).get();
    if (!project) return;
    const raw: Record<string,unknown> = {format:'storygraph',version:1,project};
    for (const key of collections) {
      const table = tables[key];
      raw[key] = db.select().from(table).where(eq(table.projectId,id)).all().map(({projectId: _projectId,...record}) => record);
    }
    const facetRows = db.select().from(tables.facets).all();
    raw.entities = (raw.entities as {id:string}[]).map((e) => ({...e,facets:facetRows.filter((f) => f.entityId === e.id).map((f) => f.name)}));
    return validateBundle(raw);
  }
  save(input: unknown, expectedRevision: number | null): Bundle {
    const b = validateBundle(input); const db = this.connection.db; const id = b.project.id;
    return db.transaction((tx) => {
      const current = tx.select().from(tables.projects).where(eq(tables.projects.id,id)).get();
      if (current ? expectedRevision !== current.revision : expectedRevision !== null) throw new ConflictError('This story was changed in another window. Export your pending changes, then reload to review the saved version.');
      b.project.revision = (current?.revision ?? -1) + 1; b.project.updatedAt = new Date().toISOString();
      if (current) tx.delete(tables.projects).where(eq(tables.projects.id,id)).run();
      tx.insert(tables.projects).values(b.project).run();
      for (const [key,kind] of [['entities','entity'],['units','unit'],['events','event'],['relationships','relationship'],['threads','thread']] as const) for (const object of b[key]) tx.insert(tables.objects).values({id:object.id,projectId:id,kind}).run();
      for (const entity of b.entities) {
        const {facets,...record} = entity;
        tx.insert(tables.entities).values({...record,projectId:id}).run();
        for (const name of facets) tx.insert(tables.facets).values({id:crypto.randomUUID(),entityId:entity.id,name}).run();
      }
      const insertUnits=(parentId:string|null)=>{for(const unit of b.units.filter((u)=>u.parentId===parentId)){tx.insert(tables.units).values({...unit,projectId:id}).run();insertUnits(unit.id);}};
      insertUnits(null);
      for (const key of ['events','relationships','threads','relationshipStates','changes','memberships','threadMemberships','links','documents','mentions','layouts'] as const) {
        // The validated union maps one-to-one to the matching Drizzle table. Each overload requires narrowing at the boundary.
        const table = tables[key];
        for (const record of b[key]) tx.insert(table).values({...record,projectId:id}).run();
      }
      return b;
    });
  }
  delete(id: string) { this.connection.db.delete(tables.projects).where(eq(tables.projects.id,id)).run(); }
}
