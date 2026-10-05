import { json, error } from '@sveltejs/kit';
import { ConflictError, ProjectRepository } from '#lib/server/repository';
import { z } from 'zod';
import { readJson } from '#lib/server/input';
import type { RequestHandler } from './$types';
export const GET: RequestHandler = ({ params }) => {
  const b = new ProjectRepository().load(params.id);
  if (!b) error(404, 'Story not found.');
  return json(b);
};
export const PUT: RequestHandler = async ({ params, request }) => {
  const input = z
    .object({ bundle: z.unknown(), revision: z.number().int().nonnegative() })
    .safeParse(await readJson(request));
  if (!input.success) error(400, 'Invalid save request.');
  try {
    const repo = new ProjectRepository();
    if (!repo.load(params.id)) error(404, 'Story not found.');
    const raw = input.data.bundle as { project?: { id?: string } };
    if (raw?.project?.id !== params.id) error(400, 'Project identifier does not match.');
    return json(repo.save(raw, input.data.revision));
  } catch (e) {
    if (e instanceof ConflictError) error(409, e.message);
    error(400, e instanceof Error ? e.message : 'Save failed.');
  }
};
export const DELETE: RequestHandler = ({ params }) => {
  new ProjectRepository().delete(params.id);
  return new Response(null, { status: 204 });
};
