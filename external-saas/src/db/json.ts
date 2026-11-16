export function jsonbParameter(value: unknown): string {
  const serialized = JSON.stringify(value);
  if (serialized === undefined) throw new TypeError("JSONB values must be JSON-serializable");
  return serialized;
}
