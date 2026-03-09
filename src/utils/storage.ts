export interface Activity {
  id: number;
  name: string;
  completed: boolean;
}

export interface DailyActivities {
  [date: string]: Activity[];
}

export interface MasterActivity {
  id: number;
  name: string;
}

export interface AppData {
  masterActivities: MasterActivity[];
  dailyActivities: DailyActivities;
}

const STORAGE_KEY = "daily-checklist-data";

const defaultData: AppData = {
  masterActivities: [],
  dailyActivities: {},
};

export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...defaultData };
    const parsed = JSON.parse(raw);
    // Migration from old format
    if (parsed.activities && parsed.dailyProgress) {
      return migrateOldData(parsed);
    }
    return parsed as AppData;
  } catch {
    return { ...defaultData };
  }
}

function migrateOldData(old: { activities: { id: number; name: string }[]; dailyProgress: { [date: string]: { [id: string]: boolean } } }): AppData {
  const data: AppData = { masterActivities: old.activities.map(a => ({ id: a.id, name: a.name })), dailyActivities: {} };
  const dates = Object.keys(old.dailyProgress);
  for (const date of dates) {
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
 * Load activities for a given date. If none exist, initialize from master template.
 */
export function loadActivitiesForDate(data: AppData, date: string): AppData {
  if (data.dailyActivities[date]) return data;
  if (data.masterActivities.length > 0) {
    data.dailyActivities[date] = data.masterActivities.map(a => ({
      id: a.id,
      name: a.name,
      completed: false,
    }));
  } else {
    data.dailyActivities[date] = [];
  }
  saveData(data);
  return { ...data };
}

export function getActivitiesForDate(data: AppData, date: string): Activity[] {
  return data.dailyActivities[date] || [];
}

export function addActivity(date: string, name: string): AppData {
  const data = loadData();
  loadActivitiesForDate(data, date);
  const id = Date.now();
  const newActivity = { id, name, completed: false };
  data.dailyActivities[date].push(newActivity);
  // Also add to master template
  data.masterActivities.push({ id, name });
  saveData(data);
  return { ...data };
}

export function deleteActivity(date: string, id: number): AppData {
  const data = loadData();
  if (data.dailyActivities[date]) {
    data.dailyActivities[date] = data.dailyActivities[date].filter(a => a.id !== id);
  }
  saveData(data);
  return { ...data };
}

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
