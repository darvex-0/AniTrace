export type MediaType = "Anime" | "Series" | "Movie";
export type MediaStatus = "Watching" | "On-Hold" | "Completed" | "Plan to Watch";

export const MEDIA_TYPES: MediaType[] = ["Anime", "Series", "Movie"];
export const MEDIA_STATUSES: MediaStatus[] = ["Watching", "On-Hold", "Completed", "Plan to Watch"];

export interface Spinoff {
  title: string;
  type: MediaType;
  relation?: "Prequel" | "Sequel" | "Spin-off" | "Related" | null;
  link?: string | null;
  watched?: boolean;
}

export interface LinkedRelation {
  id: string;
  relation: "Prequel" | "Sequel" | "Spin-off" | "Related";
}

export interface MediaItem {
  id: string;
  user_id: string;
  title: string;
  type: MediaType;
  current_ep: number;
  total_eps: number | null;
  current_season: number;
  total_seasons: number | null;
  source_name: string | null;
  source_link: string | null;
  status: MediaStatus;
  notes: string | null;
  last_watched: string | null;
  created_at: string;
  updated_at: string;
  spinoffs?: Spinoff[] | null;
  linked_spinoff_ids?: string[] | null;
  linked_relations?: LinkedRelation[] | null;
}
