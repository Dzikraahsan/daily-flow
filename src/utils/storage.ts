export interface Activity {
  id: number;
  name: string;
}

export interface DailyProgress {
  [date: string]: {
    [activityId: string]: boolean;
  };
}

export interface AppData {
  activities: Activity[];
  dailyProgress: DailyProgress;
}

const STORAGE_KEY = "daily-checklist-data";

const defaultData: AppData = {
  activities: [],
  dailyProgress: {},
};

export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...defaultData };
    return JSON.parse(raw) as AppData;
  } catch {
    return { ...defaultData };
  }
}

export function saveData(data: AppData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function addActivity(name: string): AppData {
  const data = loadData();
  const id = Date.now();
  data.activities.push({ id, name });
  saveData(data);
  return data;
}

export function deleteActivity(id: number): AppData {
  const data = loadData();
  data.activities = data.activities.filter((a) => a.id !== id);
  // Clean up progress entries
  for (const date in data.dailyProgress) {
    delete data.dailyProgress[date][String(id)];
  }
  saveData(data);
  return data;
}

export function editActivity(id: number, newName: string): AppData {
  const data = loadData();
  const activity = data.activities.find((a) => a.id === id);
  if (activity) activity.name = newName;
  saveData(data);
  return data;
}

export function toggleActivityStatus(date: string, activityId: number): AppData {
  const data = loadData();
  if (!data.dailyProgress[date]) {
    data.dailyProgress[date] = {};
  }
  const key = String(activityId);
  data.dailyProgress[date][key] = !data.dailyProgress[date][key];
  saveData(data);
  return data;
}

export function calculateDailyProgress(data: AppData, date: string): number {
  const total = data.activities.length;
  if (total === 0) return 0;
  const dayData = data.dailyProgress[date] || {};
  const completed = data.activities.filter((a) => dayData[String(a.id)]).length;
  return Math.round((completed / total) * 100);
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

export function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
