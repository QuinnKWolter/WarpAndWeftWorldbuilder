import { json, error } from '@sveltejs/kit';
import { ProjectRepository } from '#lib/server/repository';
import { blankProject, validateBundle } from '#lib/domain/model';
import { cloneProject } from '#lib/domain/operations';
import { demoProject } from '#lib/domain/demo';
import { z } from 'zod';
import { readJson } from '#lib/server/input';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = () => json(new ProjectRepository().list());
export const POST: RequestHandler = async ({ request }) => {
  const input = z
    .object({
      mode: z.enum(['blank', 'demo', 'import']),
      title: z.string().trim().min(1).max(240).optional(),
      bundle: z.unknown().optional()
    })
    .safeParse(await readJson(request));
  if (!input.success) error(400, 'Please provide a valid project.');
  try {
    const b =
      input.data.mode === 'demo'
        ? demoProject()
        : input.data.mode === 'import'
          ? cloneProject(
              validateBundle(input.data.bundle),
              input.data.title ?? validateBundle(input.data.bundle).project.title
            )
          : blankProject(input.data.title ?? 'Untitled story');
    return json(new ProjectRepository().save(b, null), { status: 201 });
  } catch (e) {
    error(400, e instanceof Error ? e.message : 'Unable to create project.');
  }
};
