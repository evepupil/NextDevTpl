export type DemoRecord = Record<string, unknown>;

export function invalidDemoData(path: string, reason: string): never {
  throw new Error(`Invalid demo data at ${path}: ${reason}`);
}

export function hasOwn(record: object, key: string): boolean {
  return Object.hasOwn(record, key);
}

export function readRecord(
  value: unknown,
  path: string,
  allowedKeys: readonly string[],
  requiredKeys: readonly string[] = allowedKeys
): DemoRecord {
  if (typeof value !== "object" || value === null) {
    return invalidDemoData(path, "must be a plain JSON object");
  }

  let isArray: boolean;
  let prototype: object | null;
  let ownKeys: PropertyKey[];
  try {
    isArray = Array.isArray(value);
    prototype = Object.getPrototypeOf(value);
    ownKeys = Reflect.ownKeys(value);
  } catch {
    return invalidDemoData(path, "must be a plain JSON object");
  }
  if (isArray || (prototype !== Object.prototype && prototype !== null)) {
    return invalidDemoData(path, "must be a plain JSON object");
  }

  const allowed = new Set(allowedKeys);
  for (const key of ownKeys) {
    if (typeof key !== "string" || !allowed.has(key)) {
      return invalidDemoData(path, "contains an unsupported field");
    }
    let descriptor: PropertyDescriptor | undefined;
    try {
      descriptor = Object.getOwnPropertyDescriptor(value, key);
    } catch {
      return invalidDemoData(path, "must contain plain JSON values");
    }
    if (!descriptor || !descriptor.enumerable || !("value" in descriptor)) {
      return invalidDemoData(path, "must contain plain JSON values");
    }
  }

  for (const key of requiredKeys) {
    if (!Object.hasOwn(value, key)) {
      return invalidDemoData(`${path}.${key}`, "is required");
    }
  }
  return value as DemoRecord;
}

export function readArray<T>(
  value: unknown,
  path: string,
  maxItems: number,
  parseItem: (item: unknown, itemPath: string) => T
): readonly T[] {
  let arrayValue: readonly unknown[] | undefined;
  try {
    if (Array.isArray(value)) arrayValue = value;
  } catch {
    return invalidDemoData(path, "must be a JSON array");
  }
  if (arrayValue === undefined) {
    return invalidDemoData(path, "must be a JSON array");
  }

  let prototype: object | null;
  let ownKeys: PropertyKey[];
  try {
    prototype = Object.getPrototypeOf(arrayValue);
    ownKeys = Reflect.ownKeys(arrayValue);
  } catch {
    return invalidDemoData(path, "must be a plain JSON array");
  }

  const length = arrayValue.length;
  if (
    prototype !== Array.prototype ||
    !Number.isSafeInteger(length) ||
    length > maxItems
  ) {
    return invalidDemoData(path, "has an invalid array shape or length");
  }
  const stringKeys = ownKeys.filter(
    (key): key is string => typeof key === "string"
  );
  if (
    stringKeys.length !== ownKeys.length ||
    stringKeys.length !== length + 1 ||
    !stringKeys.includes("length")
  ) {
    return invalidDemoData(path, "must be a dense JSON array");
  }

  const indices = new Set(stringKeys.filter((key) => key !== "length"));
  if (indices.size !== length) {
    return invalidDemoData(path, "must be a dense JSON array");
  }

  const output: T[] = [];
  for (let index = 0; index < length; index += 1) {
    const key = String(index);
    if (!indices.has(key)) {
      return invalidDemoData(path, "must be a dense JSON array");
    }
    let descriptor: PropertyDescriptor | undefined;
    try {
      descriptor = Object.getOwnPropertyDescriptor(arrayValue, key);
    } catch {
      return invalidDemoData(path, "must contain plain JSON values");
    }
    if (!descriptor || !descriptor.enumerable || !("value" in descriptor)) {
      return invalidDemoData(path, "must contain plain JSON values");
    }
    output.push(parseItem(descriptor.value, `${path}[${index}]`));
  }
  return output;
}

export function readString(
  value: unknown,
  path: string,
  minLength = 0,
  maxLength = Number.MAX_SAFE_INTEGER
): string {
  if (
    typeof value !== "string" ||
    value.length < minLength ||
    value.length > maxLength
  ) {
    return invalidDemoData(path, "has an invalid string length");
  }
  return value;
}

export function readId(value: unknown, path: string): string {
  const id = readString(value, path, 1, 64);
  if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,63}$/u.test(id)) {
    return invalidDemoData(path, "must be a valid identifier");
  }
  return id;
}

export function readSkinImagePath(value: unknown, path: string): string | null {
  if (value === null) return null;
  const imagePath = readString(value, path, 8);
  const segments = imagePath.split("/");
  if (
    !imagePath.startsWith("assets/") ||
    imagePath.includes("\\") ||
    imagePath.includes("%") ||
    imagePath.includes("?") ||
    imagePath.includes("#") ||
    imagePath.includes(":") ||
    hasControlCharacter(imagePath) ||
    segments.length < 2 ||
    segments.some(
      (segment) => segment === "" || segment === "." || segment === ".."
    )
  ) {
    return invalidDemoData(path, "must be a skin-relative assets path or null");
  }
  return imagePath;
}

function hasControlCharacter(value: string): boolean {
  for (const character of value) {
    const code = character.charCodeAt(0);
    if (code <= 0x1f || code === 0x7f) return true;
  }
  return false;
}

export function readBoolean(value: unknown, path: string): boolean {
  if (typeof value !== "boolean") {
    return invalidDemoData(path, "must be a boolean");
  }
  return value;
}

export function readSafeInteger(
  value: unknown,
  path: string,
  minimum: number
): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value)) {
    return invalidDemoData(path, "must be a safe integer");
  }
  if (value < minimum) {
    return invalidDemoData(path, "is outside the allowed range");
  }
  return value;
}

export function readEnum<const Values extends readonly string[]>(
  value: unknown,
  values: Values,
  path: string
): Values[number] {
  if (typeof value !== "string") {
    return invalidDemoData(path, "has an unsupported value");
  }
  const match = values.find((candidate) => candidate === value);
  if (match === undefined) {
    return invalidDemoData(path, "has an unsupported value");
  }
  return match;
}

export function readPlanInterval(
  value: unknown,
  path: string
): "month" | "year" {
  if (value !== "month" && value !== "year") {
    return invalidDemoData(path, "must be month or year");
  }
  return value;
}

export function readUtcTimestamp(value: unknown, path: string): string {
  const timestamp = readString(value, path, 24, 24);
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/u.test(timestamp)) {
    return invalidDemoData(path, "must be a canonical UTC timestamp");
  }
  const milliseconds = Date.parse(timestamp);
  if (!Number.isFinite(milliseconds)) {
    return invalidDemoData(path, "must be a valid UTC timestamp");
  }
  try {
    if (new Date(milliseconds).toISOString() !== timestamp) {
      return invalidDemoData(path, "must be a canonical UTC timestamp");
    }
  } catch {
    return invalidDemoData(path, "must be a valid UTC timestamp");
  }
  return timestamp;
}

export function assertUniqueIds(
  items: readonly { readonly id: string }[],
  path: string
): void {
  const ids = new Set<string>();
  for (const item of items) {
    if (ids.has(item.id)) {
      invalidDemoData(path, "contains duplicate identifiers");
    }
    ids.add(item.id);
  }
}
