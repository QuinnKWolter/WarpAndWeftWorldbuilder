import { describe, expect, it } from 'vitest';
import { parseEntityBatch } from '../src/lib/domain/entity-batch';
import { base, entitySchema, validateBundle } from '../src/lib/domain/model';
import { demoProject } from '../src/lib/domain/demo';
import { cloneProject, deleteImpact, restoreKeepingProse } from '../src/lib/domain/operations';

describe('entity batches', () => {
  it('accepts names, default facets, overrides, summaries and blank lines', () => {
    const result = parseEntityBatch(
      '\n Mira Vale \r\nStarwell | location, secret, location | A spring\nCompass | item | Points home\n',
      'character, faction'
    );
    expect(result.errors).toEqual([]);
    expect(result.rows.map(({ entity }) => [entity.name, entity.facets, entity.summary])).toEqual([
      ['Mira Vale', ['character', 'faction'], ''],
      ['Starwell', ['location', 'secret'], 'A spring'],
      ['Compass', ['item'], 'Points home']
    ]);
    const bundle = demoProject();
    bundle.entities.push(...result.rows.map(({ entity }) => ({ ...base(), ...entity })));
    expect(() => validateBundle(bundle)).not.toThrow();
  });
  it('skips equivalent names and facet sets without merging distinct entities', () => {
    const existing = [
      entitySchema.parse({ ...base(), name: 'Mira', facets: ['character', 'faction', 'character'] })
    ];
    const result = parseEntityBatch(
      'mira | faction, character\nStarwell | location\nSTARWELL | location\nMira | location',
      'character',
      existing
    );
    expect(result.skipped).toBe(2);
    expect(result.rows.map(({ entity }) => entity.name)).toEqual(['Starwell', 'Mira']);
  });
  it('reports original line numbers and enforces bounded, valid batches', () => {
    const result = parseEntityBatch(
      'Valid\n\n| item\nBad | item | summary | extra\n' + 'x'.repeat(241),
      'character'
    );
    expect(result.rows).toHaveLength(1);
    expect(result.errors).toHaveLength(3);
    expect(result.errors.map((message) => message.split(':')[0])).toEqual([
      'Line 3',
      'Line 4',
      'Line 5'
    ]);
    expect(
      parseEntityBatch(Array.from({ length: 501 }, (_, i) => `Name ${i}`).join('\n'), '').rows
    ).toEqual([]);
    expect(
      parseEntityBatch('name', Array.from({ length: 31 }, (_, i) => `facet${i}`).join(',')).errors
    ).toHaveLength(1);
  });
});

it('supports reactive-style proxies throughout deletion preview, cloning and restoration', () => {
  const bundle = demoProject();
  const proxied = new Proxy(bundle, {});
  const unit = bundle.units.find((u) => bundle.documents.some((d) => d.unitId === u.id))!;
  const before = JSON.stringify(bundle);
  expect(deleteImpact(proxied, { kind: 'unit', id: unit.id })).toBeGreaterThan(0);
  expect(cloneProject(proxied).project.id).not.toBe(bundle.project.id);
  expect(restoreKeepingProse(proxied, proxied).documents).toEqual(bundle.documents);
  expect(JSON.stringify(bundle)).toBe(before);
});
