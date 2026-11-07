# create-nextdevtpl

[中文](README.md) | [English](README.en.md)

Use `create-nextdevtpl` 4.0.0 to generate a standalone Next.js SaaS project from an official preset or a custom selection. The generated app owns its source and has no runtime dependency on this package.

Node.js 24 and pnpm 10 are required.

## Quick Start

Full SaaS project:

```bash
pnpm dlx create-nextdevtpl@4.0.0 my-app --preset saas --target vercel
```

Frontend demo project:

```bash
pnpm dlx create-nextdevtpl@4.0.0 my-demo --mode demo --target server
```

Show the complete CLI help for this version:

```bash
pnpm dlx create-nextdevtpl@4.0.0 --help
```

## Modes

Omitting `--mode` selects `full`.

| Mode | Behavior | Deployment target |
| --- | --- | --- |
| `full` | Select modules, services, and platform through a preset or custom flags | `server`, `docker`, `vercel`, `cloudflare` |
| `demo` | Retains 17 user-facing routes and 20 views; business interactions update in-memory sample data for the current tab, without real auth, payments, APIs, or a database | `server` only |

Full mode defaults to the `minimal` preset when `--preset` is omitted, and uses the selected preset's default target. Demo mode always uses `server`.

Demo mode rejects explicit `--preset`, `--modules`, and service-adapter options. Skin, palette, `--yes`, and `--no-install` remain available.

## Mode and Full Mode Flags

| Flag | Values |
| --- | --- |
| `--mode` | `full` or `demo`; defaults to `full` |
| `--preset` | `minimal`, `saas`, `ai-saas`, `custom` |
| `--modules` | Comma-separated module IDs with `--preset custom` |
| `--target` | `server`, `docker`, `vercel`, `cloudflare` |
| `--payment` | `creem`, `stripe`, `none` |
| `--storage` | `s3-compatible`, `r2-binding`, `none` |
| `--mail` | `disabled`, `resend`, `smtp`, `cloudflare-email` |
| `--ai` | `openai-compatible`, `anthropic`, `workers-ai`, `none` |
| `--alerts` | `noop`, `email`, `webhook` |
| `--analytics` | `noop`, `logger`, `posthog`, `ga4`, `umami`, `none` |
| `--jobs` | `inngest`, `cloudflare-workflows`, `none` |
| `--rate-limit` | `noop`, `upstash`, `cloudflare-rate-limit` |

The alerts option has an operations entry point when the `operations` module is selected. Use `--help` for the authoritative list shipped with the package.

## Skin Sources

`--skin` selects the skin used during generation. Each generated app contains one skin.

| Source | Example | Notes |
| --- | --- | --- |
| Built-in default | `--skin default` | The default when `--skin` is omitted |
| Local directory | `--skin ./my-skin` | The directory root contains `skin.json` |
| HTTPS archive | `--skin https://example.test/skin.tgz --skin-sha256 <64-digit-digest>` | Requires a trusted archive SHA-256; the URL cannot contain credentials, a query, or a fragment |

Remote credentials are read from an environment variable. The default name is `NEXTDEVTPL_SKIN_TOKEN`; `--skin-token-env NAME` selects another variable name. The flag takes a name, never a token value. A non-empty value must exist when an explicit name is supplied. The token is used only to authorize the download. It is omitted from logs, generated records, lockfiles, and the app, and is not passed to installation scripts.

Local example:

```bash
pnpm dlx create-nextdevtpl@4.0.0 my-app --skin ./my-skin --preset saas
```

Remote example:

```bash
pnpm dlx create-nextdevtpl@4.0.0 my-app \
  --skin https://skins.example.test/team/skin.tgz \
  --skin-sha256 <trusted-sha256> \
  --skin-token-env NEXTDEVTPL_SKIN_TOKEN \
  --preset saas
```

## StyleKit Palettes

`--palette <slug>` is available only for the built-in default skin when it declares palette support. The package contains an offline snapshot of 149 themes; generation does not contact StyleKit. The selected project receives a `STYLEKIT-LICENSE.txt` file.

```bash
pnpm dlx create-nextdevtpl@4.0.0 my-app \
  --preset saas \
  --palette glassmorphism
```

Palettes adjust only colors and radii declared by the default skin. They do not select pages, components, or layouts. A palette flag with another skin is rejected.

## Demo Data and Generated Record

A skin may declare this optional entry in `skin.json`:

```json
{
  "demo": {
    "data": "demo/data.json"
  }
}
```

The JSON must be a regular file covered by the skin's `files` hashes, fit within 256 KiB, and pass strict schema-version, field, enum, unique-ID, integer, and UTC-date validation. Objects merge recursively; arrays replace as a whole. JSON cannot contain executable code or actions. A skin cannot override plan prices or entitlements.

Only `--mode demo` parses and merges this JSON. Full mode still compares every declared file's SHA-256 with its `files` digest, but does not parse or copy files under `demo/`.

Demo mode records `mode: "demo"`, empty backend `modules`/`adapters`/`bindings`, the fixed `viewModules` list, and a digest of the merged sample data. Full mode records `mode: "full"`; older generated records without a `mode` field remain full projects. Skin records omit remote URLs, local absolute paths, and download tokens.

## Further Reading

- [Public repository and project overview](https://github.com/evepupil/NextDevTpl)
- [Generator guide](https://github.com/evepupil/NextDevTpl/blob/master/src/content/docs/en/generator.mdx)
- [Skin authoring guide](https://github.com/evepupil/NextDevTpl/blob/master/src/content/docs/en/skin-authoring.mdx)
- [Skin system rules](https://github.com/evepupil/NextDevTpl/blob/master/docs/%E6%A8%A1%E5%9D%97%E8%AE%BE%E8%AE%A1/%E7%9A%AE%E8%82%A4%E7%B3%BB%E7%BB%9F.md)
- [Upgrade guide](https://github.com/evepupil/NextDevTpl/blob/master/docs/%E5%8D%87%E7%BA%A7%E6%8C%87%E5%8D%97.md)

## License

MIT
