# kotor-runtime-api

Status: scaffold. No code yet.

The contracts that let a launcher, a game runtime, a desktop shell, a local service and a backend work
together without depending on each other. Types and schemas only, no behaviour. MIT, so any project
can implement either side.

## What it defines

| Contract | Between | Form |
|---|---|---|
| Runtime host protocol `kotor-runtime/1` | page and runtime worker | TypeScript types + JSON Schema for `MessagePort` messages: `hello`, `boot`, `input`, `pause`, `resume`, `stop`, `ext`; `progress`, `state`, `saved`, `ext-reply` |
| `GameSource` | runtime and the user's own install | interface: `list`, `stat`, `open` returning `Blob` |
| Runtime artifact manifest | runtime releases, launcher, backend | JSON Schema: version, protocol major, `qualified`, files with sha256 and size |
| Backend API | launcher and optional backend | OpenAPI |
| Service API | launcher and optional local service | TBD |

## Rules

- Semver. A breaking change bumps the major, and the `hello` handshake refuses a major it does not know.
- TAS, debugging and recording are named extensions carried by `ext`. The base protocol has none of them.
- Nothing here may import from any other repo in the map.

## Consumers

`swkotor-web`, `kotor-wasm`, `swkotor-desktop`, `swkotor-service`, `swkotor-backend`. Outside projects
(for example reone or kotor-sourceport) can implement the runtime side and be driven by the same launcher.

Planned package: `@kolto-labs/kotor-runtime-api`.

## Where this fits

One of the repos that together run KotOR I and II in the browser. The full map, the contracts and
the roadmap are in [ARCHITECTURE.md](https://github.com/kolto-labs/swkotor-web/blob/master/ARCHITECTURE.md).

No game files are distributed. Bring your own copy of KotOR I or II.
Not affiliated with Lucasfilm, Disney, BioWare, Obsidian or Aspyr.
