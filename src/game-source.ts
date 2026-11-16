/**
 * `GameSource`: read-only access to the user's own game install. Game files are never written
 * through it and never sent to a server.
 */

export type GameSourceKind = "fsa-directory" | "file-list" | "opfs-cache" | "native-fs" | "service-http";

/** A file or directory in a `GameSource`. */
export interface Entry {
  /** Last path segment. */
  name: string;
  kind: "file" | "directory";
  /** Size in bytes. Files only. */
  size?: number;
}

/**
 * Paths are relative to the install root and `/`-separated, with no leading slash; `""` is the root.
 */
export interface GameSource {
  readonly kind: GameSourceKind;
  list(dir: string): Promise<Entry[]>;
  stat(path: string): Promise<Entry | null>;
  /** A `Blob` (or `File`) so the worker can mount it without copying. */
  open(path: string): Promise<Blob>;
}
