import { entitySchema, type Bundle } from './model';

const draftSchema = entitySchema.omit({ id: true, metadata: true });
type Draft = ReturnType<typeof draftSchema.parse>;
const key = (entity: Pick<Draft, 'name' | 'facets'>) =>
  JSON.stringify([entity.name.toLowerCase(), [...new Set(entity.facets)].sort()]);

export function parseEntityBatch(
  text: string,
  defaultFacets: string,
  existing: Bundle['entities'] = [],
  useDefaults = false
) {
  const rows: { line: number; entity: Draft }[] = [];
  const errors: string[] = [];
  let skipped = 0;
  const lines = text
    .split(/\r?\n/)
    .map((value, index) => ({ value: value.trim(), line: index + 1 }))
    .filter(({ value }) => value);
  if (lines.length > 500 || text.length > 200000)
    return { rows, skipped, errors: ['Add up to 500 entities at a time.'] };
  const seen = new Set(existing.map(key));
  for (const { value, line } of lines) {
    const parts = value.split('|').map((part) => part.trim());
    if (parts.length > (useDefaults ? 3 : 4)) {
      errors.push(
        `Line ${line}: ${useDefaults ? 'use Name | summary | description.' : 'use Name | facets | summary | description (leave facets empty for defaults).'}`
      );
      continue;
    }
    const result = draftSchema.safeParse({
      name: parts[0],
      facets: [
        ...new Set(
          (useDefaults ? defaultFacets : parts[1] || defaultFacets)
            .split(',')
            .map((facet) => facet.trim())
            .filter(Boolean)
        )
      ],
      summary: parts[useDefaults ? 1 : 2] ?? '',
      description: parts[useDefaults ? 2 : 3] ?? ''
    });
    if (!result.success) {
      const issue = result.error.issues[0];
      errors.push(`Line ${line}: ${issue.path.join(' ')} — ${issue.message}`);
      continue;
    }
    const identity = key(result.data);
    if (seen.has(identity)) {
      skipped++;
      continue;
    }
    seen.add(identity);
    rows.push({ line, entity: result.data });
  }
  return { rows, skipped, errors };
}
