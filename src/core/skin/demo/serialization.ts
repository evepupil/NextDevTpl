import { validateDemoData } from "./schema.js";
import type { DemoData } from "./types.js";

function compareAscii(left: string, right: string): number {
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

function serializeValue(value: unknown): string {
  if (value === null) return "null";
  if (typeof value === "string" || typeof value === "boolean") {
    return JSON.stringify(value);
  }
  if (typeof value === "number") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map(serializeValue).join(",")}]`;
  }
  if (typeof value === "object") {
    const keys = Object.keys(value).sort(compareAscii);
    const entries = keys.map((key) => {
      const serializedKey = JSON.stringify(key);
      const serializedValue = serializeValue(Reflect.get(value, key));
      return `${serializedKey}:${serializedValue}`;
    });
    return `{${entries.join(",")}}`;
  }
  throw new Error("Validated demo data contains an unsupported value");
}

export function serializeDemoData(data: DemoData): string {
  return serializeValue(validateDemoData(data));
}
