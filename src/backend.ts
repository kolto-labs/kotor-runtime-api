/**
 * Payloads of the optional backend API. These mirror `components.schemas` in
 * `openapi/backend.yaml`; the OpenAPI document is the source of truth.
 */

/** `GET /config`. Overrides the launcher's built-in defaults. */
export interface LauncherConfig {
  /** Host name the launcher is served from. */
  siteDomain: string;
}

/** One entry of `GET /community/videos/latest`. */
export interface Video {
  title: string;
  /** Page where the video is watched. */
  url: string;
  thumbnailUrl?: string;
  /** RFC 3339 date-time. */
  publishedAt: string;
}

/** `GET /community/videos/latest`. */
export interface VideoList {
  videos: Video[];
}

/** Body of every backend error response. */
export interface ApiError {
  /** Human-readable message. */
  error: string;
}
