export interface WeekdayTemplate {
  id: number;
  name: string;
  order: number;
}

export interface DailyOverride {
  added: { id: number; name: string; order: number }[];
  deleted: number[];
  completed: { [activityId: number]: boolean };
}

export interface Activity {
  id: number;
  name: string;
  completed: boolean;
  order: number;
}

export interface HistorySnapshot {
  activities: Activity[];
}

export interface WeekdayTemplates {
  [weekday: string]: WeekdayTemplate[];
}

export interface DailyOverrides {
  [date: string]: DailyOverride;
}

export interface HistorySnapshots {
  [date: string]: HistorySnapshot;
}

export interface AppData {
  weekdayTemplates: WeekdayTemplates;
  dailyOverrides: DailyOverrides;
  historySnapshots: HistorySnapshots;
}

const STORAGE_KEY = "daily-checklist-data";
const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

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
  historySnapshots: {},
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

/** Check if a date has a frozen history snapshot */
export function hasHistorySnapshot(data: AppData, date: string): boolean {
  return !!data.historySnapshots[date];
}

/** Get the history snapshot for a date (if it exists) */
export function getHistorySnapshot(
  data: AppData,
  date: string,
): HistorySnapshot | null {
  return data.historySnapshots[date] || null;
}

/** Create a history snapshot for a date from the current dynamic activity list */
function createHistorySnapshot(data: AppData, date: string): void {
  if (data.historySnapshots[date]) return; // already exists
  const activities = computeActivitiesForDate(data, date);
  data.historySnapshots[date] = {
    activities: activities.map((a) => ({ ...a })),
  };
}

/** Dynamically compute visible activities for a date (template + overrides) */
function computeActivitiesForDate(data: AppData, date: string): Activity[] {
  const weekday = getWeekdayName(date);
  const template = (data.weekdayTemplates[weekday] || [])
    .slice()
    .sort((a, b) => a.order - b.order);
  const override = getOverride(data, date);

  const deletedSet = new Set(override.deleted);

  const activities: Activity[] = template
    .filter((t) => !deletedSet.has(t.id))
    .map((t) => ({
      id: t.id,
      name: t.name,
      completed: !!override.completed[t.id],
      order: t.order,
    }));

  // Add daily-added activities (order after template items)
  for (const a of override.added) {
    activities.push({
      id: a.id,
      name: a.name,
      completed: !!override.completed[a.id],
      order: a.order,
    });
  }

  activities.sort((a, b) => a.order - b.order);
  return activities;
}

/** Resolve visible activities for a date — uses snapshot if evaluated, otherwise dynamic */
export function getActivitiesForDate(data: AppData, date: string): Activity[] {
  const snapshot = data.historySnapshots[date];
  if (snapshot) {
    return snapshot.activities.map((a) => ({ ...a }));
  }
  return computeActivitiesForDate(data, date);
}

export function getWeekdayTemplate(
  data: AppData,
  weekday: string,
): WeekdayTemplate[] {
  return (data.weekdayTemplates[weekday] || [])
    .slice()
    .sort((a, b) => a.order - b.order);
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
  // Ensure historySnapshots exists
  if (parsed.weekdayTemplates && parsed.dailyOverrides) {
    if (!parsed.historySnapshots) parsed.historySnapshots = {};
    // Ensure order field on all templates
    for (const weekday of Object.keys(parsed.weekdayTemplates)) {
      parsed.weekdayTemplates[weekday] = parsed.weekdayTemplates[weekday].map(
        (t: any, i: number) => ({
          ...t,
          order: t.order ?? i,
        }),
      );
    }
    // Ensure order field on daily override added items
    for (const date of Object.keys(parsed.dailyOverrides)) {
      const ov = parsed.dailyOverrides[date];
      if (ov.added) {
        ov.added = ov.added.map((a: any, i: number) => ({
          ...a,
          order: a.order ?? 1000 + i,
        }));
      }
    }
    // Ensure order field on history snapshot activities
    for (const date of Object.keys(parsed.historySnapshots)) {
      const snap = parsed.historySnapshots[date];
      if (snap.activities) {
        snap.activities = snap.activities.map((a: any, i: number) => ({
          ...a,
          order: a.order ?? i,
        }));
      }
    }
    return parsed as AppData;
  }

  // Migrate from old copy-based format (weekdayTemplates + dailyActivities)
  if (parsed.weekdayTemplates && parsed.dailyActivities) {
    const data: AppData = {
      weekdayTemplates: {},
      dailyOverrides: {},
      historySnapshots: {},
    };
    for (const [weekday, items] of Object.entries(
      parsed.weekdayTemplates as { [k: string]: any[] },
    )) {
      data.weekdayTemplates[weekday] = items.map((t: any, i: number) => ({
        id: t.id,
        name: t.name,
        order: t.order ?? i,
      }));
    }
    for (const [date, acts] of Object.entries(
      parsed.dailyActivities as { [k: string]: any[] },
    )) {
      const weekday = getWeekdayName(date);
      const template = data.weekdayTemplates[weekday] || [];
      const templateIds = new Set(template.map((t) => t.id));

      const override: DailyOverride = { added: [], deleted: [], completed: {} };
      const seenIds = new Set<number>();
      for (const a of acts) {
        seenIds.add(a.id);
        if (a.completed) override.completed[a.id] = true;
        if (!templateIds.has(a.id)) {
          override.added.push({
            id: a.id,
            name: a.name,
            order: a.order ?? 1000 + override.added.length,
          });
        }
      }
      for (const t of template) {
        if (!seenIds.has(t.id)) override.deleted.push(t.id);
      }
      if (
        override.added.length ||
        override.deleted.length ||
        Object.keys(override.completed).length
      ) {
        data.dailyOverrides[date] = override;
      }
    }
    saveData(data);
    return data;
  }

  // Migrate from masterActivities format
  if (parsed.masterActivities) {
    const data: AppData = {
      weekdayTemplates: {},
      dailyOverrides: {},
      historySnapshots: {},
    };
    for (const day of WEEKDAYS) {
      data.weekdayTemplates[day] = parsed.masterActivities.map(
        (a: any, i: number) => ({ id: a.id, name: a.name, order: i }),
      );
    }
    saveData(data);
    return data;
  }

  // Legacy format
  if (parsed.activities && parsed.dailyProgress) {
    const data: AppData = {
      weekdayTemplates: {},
      dailyOverrides: {},
      historySnapshots: {},
    };
    for (const day of WEEKDAYS) {
      data.weekdayTemplates[day] = parsed.activities.map(
        (a: any, i: number) => ({ id: a.id, name: a.name, order: i }),
      );
    }
    for (const [date, progress] of Object.entries(
      parsed.dailyProgress as { [k: string]: { [id: string]: boolean } },
    )) {
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

function getNextOrder(items: { order: number }[]): number {
  if (items.length === 0) return 0;
  return Math.max(...items.map((i) => i.order)) + 1;
}

export function addActivityToTemplate(weekday: string, name: string): AppData {
  const data = loadData();
  if (!data.weekdayTemplates[weekday]) data.weekdayTemplates[weekday] = [];
  const order = getNextOrder(data.weekdayTemplates[weekday]);
  data.weekdayTemplates[weekday].push({ id: Date.now(), name, order });
  saveData(data);
  return { ...data };
}

export function deleteActivityFromTemplate(
  weekday: string,
  activityId: number,
): AppData {
  const data = loadData();
  if (data.weekdayTemplates[weekday]) {
    data.weekdayTemplates[weekday] = data.weekdayTemplates[weekday].filter(
      (a) => a.id !== activityId,
    );
  }
  // Clean up overrides for non-snapshot dates of this weekday
  for (const date of Object.keys(data.dailyOverrides)) {
    if (getWeekdayName(date) === weekday && !data.historySnapshots[date]) {
      const ov = data.dailyOverrides[date];
      ov.deleted = ov.deleted.filter((id) => id !== activityId);
      delete ov.completed[activityId];
    }
  }
  saveData(data);
  return { ...data };
}

export function editActivityInTemplate(
  weekday: string,
  activityId: number,
  newName: string,
): AppData {
  const data = loadData();
  const template = data.weekdayTemplates[weekday];
  if (template) {
    const item = template.find((a) => a.id === activityId);
    if (item) item.name = newName;
  }
  saveData(data);
  return { ...data };
}

/** Move an activity to a new position in the weekday template */
export function moveActivityInTemplate(
  weekday: string,
  activityId: number,
  direction: "up" | "down",
): AppData {
  const data = loadData();
  const template = data.weekdayTemplates[weekday];
  if (!template) return data;

  const sorted = template.slice().sort((a, b) => a.order - b.order);
  const idx = sorted.findIndex((a) => a.id === activityId);
  if (idx < 0) return data;

  const swapIdx = direction === "up" ? idx - 1 : idx + 1;
  if (swapIdx < 0 || swapIdx >= sorted.length) return data;

  // Swap order values
  const tempOrder = sorted[idx].order;
  const item = template.find((a) => a.id === sorted[idx].id)!;
  const swapItem = template.find((a) => a.id === sorted[swapIdx].id)!;
  item.order = swapItem.order;
  swapItem.order = tempOrder;

  saveData(data);
  return { ...data };
}

// ---- Daily override operations (Checklist - per date) ----

/** Add activity for one specific date only */
export function addDailyActivity(date: string, name: string): AppData {
  const data = loadData();
  if (data.historySnapshots[date]) {
    // Add to snapshot instead
    const snap = data.historySnapshots[date];
    const maxOrder =
      snap.activities.length > 0
        ? Math.max(...snap.activities.map((a) => a.order)) + 1
        : 0;
    snap.activities.push({
      id: Date.now(),
      name,
      completed: false,
      order: maxOrder,
    });
    saveData(data);
    return { ...data };
  }
  const ov = ensureOverride(data, date);
  const weekday = getWeekdayName(date);
  const templateItems = data.weekdayTemplates[weekday] || [];
  const maxTemplateOrder = getNextOrder([...templateItems, ...ov.added]);
  ov.added.push({ id: Date.now(), name, order: maxTemplateOrder });
  saveData(data);
  return { ...data };
}

/** Delete activity from a specific date only */
export function deleteDailyActivity(date: string, activityId: number): AppData {
  const data = loadData();
  if (data.historySnapshots[date]) {
    // Remove from snapshot
    data.historySnapshots[date].activities = data.historySnapshots[
      date
    ].activities.filter((a) => a.id !== activityId);
    saveData(data);
    return { ...data };
  }
  const ov = ensureOverride(data, date);
  const addedIdx = ov.added.findIndex((a) => a.id === activityId);
  if (addedIdx >= 0) {
    ov.added.splice(addedIdx, 1);
  } else {
    if (!ov.deleted.includes(activityId)) {
      ov.deleted.push(activityId);
    }
  }
  delete ov.completed[activityId];
  saveData(data);
  return { ...data };
}

/** Edit activity name for a specific date */
export function editDailyActivity(
  date: string,
  activityId: number,
  newName: string,
): AppData {
  const data = loadData();
  if (data.historySnapshots[date]) {
    const act = data.historySnapshots[date].activities.find(
      (a) => a.id === activityId,
    );
    if (act) act.name = newName;
    saveData(data);
    return { ...data };
  }
  const ov = ensureOverride(data, date);
  const added = ov.added.find((a) => a.id === activityId);
  if (added) added.name = newName;
  saveData(data);
  return { ...data };
}

/** Toggle completion for a specific date — creates history snapshot on first evaluation */
export function toggleActivityStatus(
  date: string,
  activityId: number,
): AppData {
  const data = loadData();

  // If no snapshot yet, create one (first evaluation freezes the activity list)
  if (!data.historySnapshots[date]) {
    createHistorySnapshot(data, date);
  }

  // Toggle within the snapshot
  const snap = data.historySnapshots[date];
  const act = snap.activities.find((a) => a.id === activityId);
  if (act) {
    act.completed = !act.completed;
  }

  saveData(data);
  return { ...data };
}

// ---- Progress ----

export function calculateDailyProgress(data: AppData, date: string): number {
  const activities = getActivitiesForDate(data, date);
  if (activities.length === 0) return 0;
  const completed = activities.filter((a) => a.completed).length;
  return Math.round((completed / activities.length) * 100);
}

export function getLast10DaysProgress(
  data: AppData,
  selectedDate: string,
): { date: string; progress: number }[] {
  const result: { date: string; progress: number }[] = [];
  const base = new Date(selectedDate + "T00:00:00");
  for (let i = 9; i >= 0; i--) {
    const d = new Date(base);
    d.setDate(d.getDate() - i);
    const dateStr = formatDate(d);
    result.push({
      date: dateStr,
      progress: calculateDailyProgress(data, dateStr),
    });
  }
  return result;
}

export function resetAllData(): void {
  localStorage.removeItem(STORAGE_KEY);
}
