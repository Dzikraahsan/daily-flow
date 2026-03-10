export interface WeekdayTemplate {
  id: number;
  name: string;
}

export interface DailyOverride {
  added: { id: number; name: string }[];
  deleted: number[]; // IDs of template activities removed for this date
  completed: { [activityId: number]: boolean };
}

export interface Activity {
  id: number;
  name: string;
  completed: boolean;
}

export interface WeekdayTemplates {
  [weekday: string]: WeekdayTemplate[];
}

export interface DailyOverrides {
  [date: string]: DailyOverride;
}

export interface AppData {
  weekdayTemplates: WeekdayTemplates;
  dailyOverrides: DailyOverrides;
}

const STORAGE_KEY = "daily-checklist-data";
const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function getWeekdayName(date: string): string {
  const d = new Date(date + "T00:00:00");
  return WEEKDAYS[d.getDay()];
}

export function getAllWeekdays(): string[] {
  return [...WEEKDAYS];
}

export function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const defaultData: AppData = {
  weekdayTemplates: {},
  dailyOverrides: {},
};

function getOverride(data: AppData, date: string): DailyOverride {
  return data.dailyOverrides[date] || { added: [], deleted: [], completed: {} };
}

function ensureOverride(data: AppData, date: string): DailyOverride {
  if (!data.dailyOverrides[date]) {
    data.dailyOverrides[date] = { added: [], deleted: [], completed: {} };
  }
  return data.dailyOverrides[date];
}

/** Dynamically resolve visible activities for a date */
export function getActivitiesForDate(data: AppData, date: string): Activity[] {
  const weekday = getWeekdayName(date);
  const template = data.weekdayTemplates[weekday] || [];
  const override = getOverride(data, date);

  const deletedSet = new Set(override.deleted);

  const activities: Activity[] = template
    .filter(t => !deletedSet.has(t.id))
    .map(t => ({
      id: t.id,
      name: t.name,
      completed: !!override.completed[t.id],
    }));

  // Add daily-added activities
  for (const a of override.added) {
    activities.push({
      id: a.id,
      name: a.name,
      completed: !!override.completed[a.id],
    });
  }

  return activities;
}

export function getWeekdayTemplate(data: AppData, weekday: string): WeekdayTemplate[] {
  return data.weekdayTemplates[weekday] || [];
}

// ---- Persistence ----

export function saveData(data: AppData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return JSON.parse(JSON.stringify(defaultData));
    const parsed = JSON.parse(raw);
    return migrateIfNeeded(parsed);
  } catch {
    return JSON.parse(JSON.stringify(defaultData));
  }
}

function migrateIfNeeded(parsed: any): AppData {
  // Already new format
  if (parsed.weekdayTemplates && parsed.dailyOverrides) {
    return parsed as AppData;
  }

  // Migrate from old copy-based format (weekdayTemplates + dailyActivities)
  if (parsed.weekdayTemplates && parsed.dailyActivities) {
    const data: AppData = {
      weekdayTemplates: parsed.weekdayTemplates,
      dailyOverrides: {},
    };
    // Convert dailyActivities snapshots to overrides
    for (const [date, acts] of Object.entries(parsed.dailyActivities as { [k: string]: any[] })) {
      const weekday = getWeekdayName(date);
      const template = (parsed.weekdayTemplates[weekday] || []) as WeekdayTemplate[];
      const templateIds = new Set(template.map((t: WeekdayTemplate) => t.id));

      const override: DailyOverride = { added: [], deleted: [], completed: {} };

      const seenIds = new Set<number>();
      for (const a of acts) {
        seenIds.add(a.id);
        if (a.completed) override.completed[a.id] = true;
        if (!templateIds.has(a.id)) {
          override.added.push({ id: a.id, name: a.name });
        }
      }
      // Deleted = in template but not in daily snapshot
      for (const t of template) {
        if (!seenIds.has(t.id)) override.deleted.push(t.id);
      }

      // Only store override if non-empty
      if (override.added.length || override.deleted.length || Object.keys(override.completed).length) {
        data.dailyOverrides[date] = override;
      }
    }
    saveData(data);
    return data;
  }

  // Migrate from masterActivities format
  if (parsed.masterActivities) {
    const data: AppData = { weekdayTemplates: {}, dailyOverrides: {} };
    for (const day of WEEKDAYS) {
      data.weekdayTemplates[day] = parsed.masterActivities.map((a: any) => ({ id: a.id, name: a.name }));
    }
    saveData(data);
    return data;
  }

  // Legacy format
  if (parsed.activities && parsed.dailyProgress) {
    const data: AppData = { weekdayTemplates: {}, dailyOverrides: {} };
    for (const day of WEEKDAYS) {
      data.weekdayTemplates[day] = parsed.activities.map((a: any) => ({ id: a.id, name: a.name }));
    }
    for (const [date, progress] of Object.entries(parsed.dailyProgress as { [k: string]: { [id: string]: boolean } })) {
      const completed: { [id: number]: boolean } = {};
      for (const [id, val] of Object.entries(progress)) {
        if (val) completed[Number(id)] = true;
      }
      if (Object.keys(completed).length) {
        data.dailyOverrides[date] = { added: [], deleted: [], completed };
      }
    }
    saveData(data);
    return data;
  }

  return JSON.parse(JSON.stringify(defaultData));
}

// ---- Template operations (Activity Manager - global) ----

export function addActivityToTemplate(weekday: string, name: string): AppData {
  const data = loadData();
  if (!data.weekdayTemplates[weekday]) data.weekdayTemplates[weekday] = [];
  data.weekdayTemplates[weekday].push({ id: Date.now(), name });
  saveData(data);
  return { ...data };
}

export function deleteActivityFromTemplate(weekday: string, activityId: number): AppData {
  const data = loadData();
  if (data.weekdayTemplates[weekday]) {
    data.weekdayTemplates[weekday] = data.weekdayTemplates[weekday].filter(a => a.id !== activityId);
  }
  // Clean up: remove from deleted lists and completed maps in overrides for this weekday
  for (const date of Object.keys(data.dailyOverrides)) {
    if (getWeekdayName(date) === weekday) {
      const ov = data.dailyOverrides[date];
      ov.deleted = ov.deleted.filter(id => id !== activityId);
      delete ov.completed[activityId];
    }
  }
  saveData(data);
  return { ...data };
}

export function editActivityInTemplate(weekday: string, activityId: number, newName: string): AppData {
  const data = loadData();
  const template = data.weekdayTemplates[weekday];
  if (template) {
    const item = template.find(a => a.id === activityId);
    if (item) item.name = newName;
  }
  saveData(data);
  return { ...data };
}

// ---- Daily override operations (Checklist - per date) ----

/** Add activity for one specific date only */
export function addDailyActivity(date: string, name: string): AppData {
  const data = loadData();
  const ov = ensureOverride(data, date);
  ov.added.push({ id: Date.now(), name });
  saveData(data);
  return { ...data };
}

/** Delete activity from a specific date only */
export function deleteDailyActivity(date: string, activityId: number): AppData {
  const data = loadData();
  const ov = ensureOverride(data, date);

  // Check if it's a daily-added activity
  const addedIdx = ov.added.findIndex(a => a.id === activityId);
  if (addedIdx >= 0) {
    ov.added.splice(addedIdx, 1);
  } else {
    // It's a template activity — mark as deleted for this date
    if (!ov.deleted.includes(activityId)) {
      ov.deleted.push(activityId);
    }
  }
  delete ov.completed[activityId];
  saveData(data);
  return { ...data };
}

/** Edit activity name for a specific date (daily-added only) */
export function editDailyActivity(date: string, activityId: number, newName: string): AppData {
  const data = loadData();
  const ov = ensureOverride(data, date);
  const added = ov.added.find(a => a.id === activityId);
  if (added) added.name = newName;
  // Note: editing template activity names per-date is not supported to keep data clean
  saveData(data);
  return { ...data };
}

/** Toggle completion for a specific date */
export function toggleActivityStatus(date: string, activityId: number): AppData {
  const data = loadData();
  const ov = ensureOverride(data, date);
  ov.completed[activityId] = !ov.completed[activityId];
  if (!ov.completed[activityId]) delete ov.completed[activityId];
  saveData(data);
  return { ...data };
}

// ---- Progress ----

export function calculateDailyProgress(data: AppData, date: string): number {
  const activities = getActivitiesForDate(data, date);
  if (activities.length === 0) return 0;
  const completed = activities.filter(a => a.completed).length;
  return Math.round((completed / activities.length) * 100);
}

export function getLast10DaysProgress(data: AppData, selectedDate: string): { date: string; progress: number }[] {
  const result: { date: string; progress: number }[] = [];
  const base = new Date(selectedDate + "T00:00:00");
  for (let i = 9; i >= 0; i--) {
    const d = new Date(base);
    d.setDate(d.getDate() - i);
    const dateStr = formatDate(d);
    result.push({ date: dateStr, progress: calculateDailyProgress(data, dateStr) });
  }
  return result;
}

export function resetAllData(): void {
  localStorage.removeItem(STORAGE_KEY);
}
