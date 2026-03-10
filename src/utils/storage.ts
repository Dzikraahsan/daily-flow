export interface Activity {
  id: number;
  name: string;
  completed: boolean;
}

export interface WeekdayTemplate {
  id: number;
  name: string;
}

export interface WeekdayTemplates {
  [weekday: string]: WeekdayTemplate[]; // "Monday", "Tuesday", etc.
}

export interface DailyActivities {
  [date: string]: Activity[];
}

export interface AppData {
  weekdayTemplates: WeekdayTemplates;
  dailyActivities: DailyActivities;
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

const defaultData: AppData = {
  weekdayTemplates: {},
  dailyActivities: {},
};

export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return JSON.parse(JSON.stringify(defaultData));
    const parsed = JSON.parse(raw);
    // Migration from old formats
    if (parsed.masterActivities) {
      return migrateFromMasterTemplate(parsed);
    }
    if (parsed.activities && parsed.dailyProgress) {
      return migrateFromLegacy(parsed);
    }
    return parsed as AppData;
  } catch {
    return JSON.parse(JSON.stringify(defaultData));
  }
}

function migrateFromMasterTemplate(old: { masterActivities: { id: number; name: string }[]; dailyActivities: DailyActivities }): AppData {
  const data: AppData = { weekdayTemplates: {}, dailyActivities: old.dailyActivities || {} };
  // Set all weekdays to the master template
  for (const day of WEEKDAYS) {
    data.weekdayTemplates[day] = old.masterActivities.map(a => ({ id: a.id, name: a.name }));
  }
  saveData(data);
  return data;
}

function migrateFromLegacy(old: { activities: { id: number; name: string }[]; dailyProgress: { [date: string]: { [id: string]: boolean } } }): AppData {
  const data: AppData = { weekdayTemplates: {}, dailyActivities: {} };
  for (const day of WEEKDAYS) {
    data.weekdayTemplates[day] = old.activities.map(a => ({ id: a.id, name: a.name }));
  }
  for (const date of Object.keys(old.dailyProgress)) {
    data.dailyActivities[date] = old.activities.map(a => ({
      id: a.id,
      name: a.name,
      completed: !!old.dailyProgress[date]?.[String(a.id)],
    }));
  }
  saveData(data);
  return data;
}

export function saveData(data: AppData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Load activities for a given date. If none exist, initialize from weekday template.
 */
export function loadActivitiesForDate(data: AppData, date: string): AppData {
  if (data.dailyActivities[date]) return data;
  const weekday = getWeekdayName(date);
  const template = data.weekdayTemplates[weekday] || [];
  data.dailyActivities[date] = template.map(a => ({
    id: a.id,
    name: a.name,
    completed: false,
  }));
  saveData(data);
  return { ...data };
}

export function getActivitiesForDate(data: AppData, date: string): Activity[] {
  return data.dailyActivities[date] || [];
}

export function getWeekdayTemplate(data: AppData, weekday: string): WeekdayTemplate[] {
  return data.weekdayTemplates[weekday] || [];
}

/** Add activity to a weekday template (from Activity Manager) */
export function addActivityToTemplate(weekday: string, name: string): AppData {
  const data = loadData();
  const id = Date.now();
  if (!data.weekdayTemplates[weekday]) data.weekdayTemplates[weekday] = [];
  data.weekdayTemplates[weekday].push({ id, name });
  saveData(data);
  return { ...data };
}

/** Delete activity from weekday template (global delete - affects all dates of that weekday) */
export function deleteActivityFromTemplate(weekday: string, activityId: number): AppData {
  const data = loadData();
  if (data.weekdayTemplates[weekday]) {
    data.weekdayTemplates[weekday] = data.weekdayTemplates[weekday].filter(a => a.id !== activityId);
  }
  // Also remove from all daily overrides for this weekday
  for (const date of Object.keys(data.dailyActivities)) {
    if (getWeekdayName(date) === weekday) {
      data.dailyActivities[date] = data.dailyActivities[date].filter(a => a.id !== activityId);
    }
  }
  saveData(data);
  return { ...data };
}

/** Edit activity in weekday template */
export function editActivityInTemplate(weekday: string, activityId: number, newName: string): AppData {
  const data = loadData();
  const template = data.weekdayTemplates[weekday];
  if (template) {
    const item = template.find(a => a.id === activityId);
    if (item) item.name = newName;
  }
  // Also update in all daily overrides for this weekday
  for (const date of Object.keys(data.dailyActivities)) {
    if (getWeekdayName(date) === weekday) {
      const act = data.dailyActivities[date].find(a => a.id === activityId);
      if (act) act.name = newName;
    }
  }
  saveData(data);
  return { ...data };
}

/** Add activity to a specific date only (daily override) */
export function addActivity(date: string, name: string): AppData {
  const data = loadData();
  loadActivitiesForDate(data, date);
  const id = Date.now();
  data.dailyActivities[date].push({ id, name, completed: false });
  // Also add to weekday template
  const weekday = getWeekdayName(date);
  if (!data.weekdayTemplates[weekday]) data.weekdayTemplates[weekday] = [];
  data.weekdayTemplates[weekday].push({ id, name });
  saveData(data);
  return { ...data };
}

/** Delete activity from a specific date only (daily override, does NOT affect template) */
export function deleteActivity(date: string, id: number): AppData {
  const data = loadData();
  if (data.dailyActivities[date]) {
    data.dailyActivities[date] = data.dailyActivities[date].filter(a => a.id !== id);
  }
  saveData(data);
  return { ...data };
}

/** Edit activity on a specific date only */
export function editActivity(date: string, id: number, newName: string): AppData {
  const data = loadData();
  const activities = data.dailyActivities[date];
  if (activities) {
    const activity = activities.find(a => a.id === id);
    if (activity) activity.name = newName;
  }
  saveData(data);
  return { ...data };
}

export function toggleActivityStatus(date: string, activityId: number): AppData {
  const data = loadData();
  const activities = data.dailyActivities[date];
  if (activities) {
    const activity = activities.find(a => a.id === activityId);
    if (activity) activity.completed = !activity.completed;
  }
  saveData(data);
  return { ...data };
}

export function calculateDailyProgress(data: AppData, date: string): number {
  const activities = data.dailyActivities[date];
  if (!activities || activities.length === 0) return 0;
  const completed = activities.filter(a => a.completed).length;
  return Math.round((completed / activities.length) * 100);
}

export function getLast10DaysProgress(data: AppData, selectedDate: string): { date: string; progress: number }[] {
  const result: { date: string; progress: number }[] = [];
  const base = new Date(selectedDate);
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
