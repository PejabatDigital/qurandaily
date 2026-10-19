// Shapes the API (worker/api.ts) sends back. Shared by the Worker and the app.

/** A reading plan. Still called a "campaign" in the code and database. */
export interface Campaign {
  id: string;
  user_id: string;
  title: string;
  start_page: number;
  end_page: number;
  /** YYYY-MM-DD, in the reader's time zone. */
  start_date: string;
  end_date: string;
  is_active: boolean;
  /** Milestone keys already shown for this plan (src/lib/milestones.ts). */
  milestones_shown: string[];
  created_at: string;
  updated_at: string;
}

export interface ReadingLog {
  id: string;
  campaign_id: string;
  user_id: string;
  pages_read: number;
  /** The next page to read after this log. */
  current_page_marker: number;
  created_at: string;
}

export interface Profile {
  email: string;
  display_name: string | null;
  /** JAKIM zone code, e.g. WLY01. */
  prayer_zone: string | null;
}
