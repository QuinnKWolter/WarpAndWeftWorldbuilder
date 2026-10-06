import type { Bundle } from '../domain/model';
export function download(text: string, filename: string, type = 'application/json') {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function exportProject(b: Bundle) {
  download(
    JSON.stringify(b, null, 2),
    `${b.project.title.replace(/[^\p{L}\p{N} -]/gu, '').trim() || 'story'}.warp-weft.json`
  );
}
export async function readImport(file: File): Promise<unknown> {
  if (file.size > 20 * 1024 * 1024) throw new Error('Imports are limited to 20 MB.');
  try {
    return JSON.parse(await file.text()) as unknown;
  } catch {
    throw new Error('This file is not valid Warp & Weft Worldbuilder JSON.');
  }
}
export async function api<T>(url: string, method = 'GET', body?: unknown): Promise<T> {
  const response = await fetch(url, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined
  });
  if (response.status === 204) return undefined as T;
  const result: unknown = await response.json();
  if (!response.ok)
    throw new Error(
      typeof result === 'object' && result !== null && 'message' in result
        ? String(result.message)
        : 'The request could not be completed.'
    );
  return result as T;
}
