import { getCloudflareContext } from "@opennextjs/cloudflare";

function getBinding<T extends object>(bindingName: string): T {
  const env = getCloudflareContext().env;
  const binding: unknown = Reflect.get(env, bindingName);
  if (typeof binding !== "object" || binding === null) {
    throw new Error(`Cloudflare binding is not configured: ${bindingName}`);
  }
  return binding as T;
}

export function createLazyCloudflareBinding<T extends object>(
  bindingName: string
): T {
  return new Proxy({} as T, {
    get(_target, property) {
      const binding = getBinding<T>(bindingName);
      const value = Reflect.get(binding, property, binding) as unknown;
      return typeof value === "function" ? value.bind(binding) : value;
    },
  });
}

export function createCloudflareBindingMap<T extends object>(
  bindingName: string
): Readonly<Record<string, T>> {
  const binding = createLazyCloudflareBinding<T>(bindingName);
  return new Proxy(Object.create(null) as Record<string, T>, {
    get: () => binding,
  });
}
