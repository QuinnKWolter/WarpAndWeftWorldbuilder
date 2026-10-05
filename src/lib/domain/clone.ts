// Story bundles contain JSON data. Serialization also unwraps reactive proxies,
// which structuredClone cannot accept when operations run from the workspace.
export function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
