/**
 * `runtime-manifest.json`, published with every runtime release. The launcher pins one manifest
 * version; a backend serves the files it lists. JSON Schema: `schemas/runtime-manifest.schema.json`.
 */

export interface RuntimeManifestFile {
  /** File name, a single URL path segment: `GET /runtime/{version}/files/{name}`. */
  name: string;
  /** Lowercase hex SHA-256 of the file contents. */
  sha256: string;
  /** Size in bytes. */
  size: number;
}

export interface RuntimeManifest {
  /** Release version (semver). */
  version: string;
  /** Major of the runtime host protocol the release implements. */
  protocol: number;
  /** Whether the release passed qualification. */
  qualified: boolean;
  /** Every file in the release: wasm, JS, shell and archive chunks. */
  files: RuntimeManifestFile[];
}
