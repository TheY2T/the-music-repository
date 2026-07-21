/** A space's animated background choice (scene id + 0–100 intensity). */
export interface DashboardBackgroundPref {
  style: string;
  intensity: number;
}

/** One widget placed on a space's grid; `config` is a widget-type-specific bag. */
export interface DashboardWidget {
  id: string;
  type: string;
  x: number;
  y: number;
  w: number;
  h: number;
  config: Record<string, unknown>;
}

/** A single named practice space — an arrangeable grid of widgets. */
export interface DashboardSpace {
  id: string;
  name: string;
  icon?: string;
  background?: DashboardBackgroundPref;
  widgets: DashboardWidget[];
}

/** A user's whole collection of practice spaces plus which one opens by default. */
export interface DashboardSpacesData {
  spaces: DashboardSpace[];
  activeSpaceId?: string;
}

/** A stored spaces record with its last-updated time. */
export interface StoredDashboardSpaces extends DashboardSpacesData {
  updatedAt: Date;
}

/** The empty collection a user starts with before saving anything. */
export const EMPTY_DASHBOARD_SPACES: DashboardSpacesData = {
  spaces: [],
  activeSpaceId: undefined,
};
