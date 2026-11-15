# kotor-runtime-api

`@kolto-labs/kotor-runtime-api`: the contracts that let a launcher, a game runtime, a desktop shell,
a local service and a backend work together without depending on each other. Types, JSON Schemas and
an OpenAPI document; no behaviour beyond a few type guards. MIT, so any project can implement either
side.

| Contract | Between | Ships as |
|---|---|---|
| Runtime host protocol `kotor-runtime/1` | page and runtime worker | TypeScript types, `schemas/protocol.schema.json` |
| `GameSource` | runtime and the user's own install | TypeScript interface |
| Runtime manifest | runtime releases, launcher, backend | TypeScript types, `schemas/runtime-manifest.schema.json` |
| Backend API (optional) | launcher and backend | `openapi/backend.yaml` (OpenAPI 3.1) |

## Runtime host protocol

Messages over a `MessagePort`. The first message each way is `hello`; a side that does not know the
peer's protocol major refuses it. Host to runtime: `hello`, `boot`, `input`, `pause`, `resume`, `stop`,
`ext`. Runtime to host: `hello`, `progress`, `state`, `saved`, `ext-reply`. TAS, debugging and
recording are named extensions carried by `ext` / `ext-reply`; the base protocol has none of them.

```ts
import { PROTOCOL, isRuntimeMessage, type HostMessage } from "@kolto-labs/kotor-runtime-api";

const send = (m: HostMessage) => port.postMessage(m);
send({ type: "hello", protocol: PROTOCOL, role: "host", capabilities: [] });
send({ type: "boot", game: "k1", source: { kind: "file-list", id: "install-1" }, saves: { id: "saves-1" } });

port.onmessage = ({ data }) => {
  if (!isRuntimeMessage(data)) return;
  if (data.type === "progress") console.log(data.phase, data.done, data.total);
};
```

The guards check the `type` only. Validate the full shape against `protocol.schema.json` when the peer
is untrusted.

## GameSource

Read-only access to the user's own game install. Paths are relative to the install root and
`/`-separated. Game files are never written through it and never sent to a server.

```ts
import type { Entry, GameSource } from "@kolto-labs/kotor-runtime-api";

function fileListSource(files: File[]): GameSource {
  const byPath = new Map(files.map((f) => [f.webkitRelativePath.split("/").slice(1).join("/"), f]));
  const entry = (path: string, f: File): Entry => ({ name: path.split("/").pop()!, kind: "file", size: f.size });
  return {
    kind: "file-list",
    async list(dir) {
      const prefix = dir ? `${dir}/` : "";
      return [...byPath].filter(([p]) => p.startsWith(prefix) && !p.slice(prefix.length).includes("/"))
        .map(([p, f]) => entry(p, f));
    },
    async stat(path) {
      const f = byPath.get(path);
      return f ? entry(path, f) : null;
    },
    async open(path) {
      const f = byPath.get(path);
      if (!f) throw new Error(`not found: ${path}`);
      return f;
    },
  };
}
```

(Directories are omitted from `list` here for brevity.)

## Runtime manifest

`runtime-manifest.json` ships with every runtime release: the release version, the protocol major it
implements, whether it passed qualification, and every file with its SHA-256 and size.

```json
{
  "version": "1.2.0",
  "protocol": 1,
  "qualified": true,
  "files": [
    { "name": "runtime.wasm", "sha256": "<64 lowercase hex digits>", "size": 31457280 },
    { "name": "runtime.js", "sha256": "<64 lowercase hex digits>", "size": 182044 }
  ]
}
```

```ts
import type { RuntimeManifest } from "@kolto-labs/kotor-runtime-api";
import { Ajv2020 } from "ajv/dist/2020.js";
import schema from "@kolto-labs/kotor-runtime-api/schemas/runtime-manifest.schema.json" with { type: "json" };

const validate = new Ajv2020().compile<RuntimeManifest>(schema);
const manifest: unknown = await (await fetch(`${base}/runtime/1.2.0/manifest`)).json();
if (!validate(manifest)) throw new Error(JSON.stringify(validate.errors));
```

## Backend API

`openapi/backend.yaml` describes an optional backend: `GET /config`, `GET /community/videos/latest`,
`GET /runtime/{version}/manifest` and `GET /runtime/{version}/files/{name}` (byte ranges, ETag). The
launcher works without it, using its built-in config and a static artifact URL.

## Install

Not published to a registry yet. Install from a git ref; the `prepare` script builds `dist/` on
install:

```sh
npm install github:kolto-labs/kotor-runtime-api#<tag-or-commit>
```

Entry points: the package root (types and guards), `@kolto-labs/kotor-runtime-api/schemas/*` and
`@kolto-labs/kotor-runtime-api/openapi/*`.

## Versioning

- The package follows semver. Adding optional fields or new message types an old peer can ignore is a
  minor release; anything an existing implementation could reject is a major release.
- The runtime host protocol has its own major, in `hello.protocol` (`kotor-runtime/1`) and the
  manifest's `protocol` field. A protocol major bump is a breaking change and bumps the package major.
- Each schema's `$id` carries the package version it ships in
  (`https://raw.githubusercontent.com/kolto-labs/kotor-runtime-api/v0.1.0/schemas/...`), so a
  validator can tell which release a schema came from. A test keeps it in step with `package.json`.
- Unknown properties are allowed in every message and manifest, so readers must ignore what they do
  not know.

## Development

```sh
npm install
npm test                # typecheck, then schema and guard tests
npm run lint:openapi    # Redocly lint of openapi/backend.yaml
npm run build           # dist/
```

## Where this fits

One of the repos that together run KotOR I and II in the browser. The full map, the contracts and
the roadmap are in [ARCHITECTURE.md](https://github.com/kolto-labs/swkotor-web/blob/master/ARCHITECTURE.md).
Nothing here imports from any other repo in that map.

No game files are distributed. Bring your own copy of KotOR I or II.
Not affiliated with Lucasfilm, Disney, BioWare, Obsidian or Aspyr.
