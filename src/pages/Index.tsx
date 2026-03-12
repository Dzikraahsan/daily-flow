import { useState, useCallback, useMemo } from "react";
import { CheckCircle2 } from "lucide-react";
import CalendarPicker from "@/components/CalendarPicker";
import ProgressBar from "@/components/ProgressBar";
import Checklist from "@/components/Checklist";
import ActivityManager from "@/components/ActivityManager";
import HistoryTable from "@/components/HistoryTable";
import ProgressChart from "@/components/ProgressChart";
import ThemeToggle from "@/components/ThemeToggle";
import ResetData from "@/components/ResetData";
import Footer from "@/components/Footer";
import {
  loadData,
  getActivitiesForDate,
  getWeekdayTemplate,
  hasHistorySnapshot,
  getWeekdayName,
  addActivityToTemplate,
  deleteActivityFromTemplate,
  editActivityInTemplate,
  addDailyActivity,
  deleteDailyActivity,
  editDailyActivity,
  toggleActivityStatus,
  moveActivityInTemplate,
  moveDailyActivity,
  calculateDailyProgress,
  getLast10DaysProgress,
  formatDate,
  type AppData,
} from "@/utils/storage";

const todayStr = formatDate(new Date());

const Index = () => {
  const [data, setData] = useState<AppData>(loadData);
  const [selectedDate, setSelectedDate] = useState(todayStr);

  const weekday = useMemo(() => getWeekdayName(selectedDate), [selectedDate]);
  const activities = useMemo(() => getActivitiesForDate(data, selectedDate), [data, selectedDate]);
  const isSnapshot = useMemo(() => hasHistorySnapshot(data, selectedDate), [data, selectedDate]);
  const template = useMemo(() => getWeekdayTemplate(data, weekday), [data, weekday]);
  const progress = useMemo(() => calculateDailyProgress(data, selectedDate), [data, selectedDate]);
  const chartData = useMemo(() => getLast10DaysProgress(data, selectedDate), [data, selectedDate]);

  // Daily checklist handlers (affect only selected date)
  const handleDailyAdd = useCallback((name: string) => setData(addDailyActivity(selectedDate, name)), [selectedDate]);
  const handleDailyDelete = useCallback((id: number) => setData(deleteDailyActivity(selectedDate, id)), [selectedDate]);
  const handleDailyEdit = useCallback((id: number, name: string) => setData(editDailyActivity(selectedDate, id, name)), [selectedDate]);
  const handleToggle = useCallback((id: number) => setData(toggleActivityStatus(selectedDate, id)), [selectedDate]);
  const handleDailyMove = useCallback((id: number, direction: "up" | "down") => setData(moveDailyActivity(selectedDate, id, direction)), [selectedDate]);

  // Activity Manager handlers (affect weekday template globally)
  const handleTemplateAdd = useCallback((name: string) => setData(addActivityToTemplate(weekday, name)), [weekday]);
  const handleTemplateDelete = useCallback((id: number) => setData(deleteActivityFromTemplate(weekday, id)), [weekday]);
  const handleTemplateEdit = useCallback((id: number, name: string) => setData(editActivityInTemplate(weekday, id, name)), [weekday]);
  const handleTemplateMove = useCallback((id: number, direction: "up" | "down") => setData(moveActivityInTemplate(weekday, id, direction)), [weekday]);

  const handleReset = useCallback(() => setData(loadData()), []);

  return (
    <div className="min-h-screen bg-background transition-colors duration-300">
      <header className="sticky top-0 z-10 bg-background/70 backdrop-blur-md border-b border-border transition-colors duration-300">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground leading-tight">Daily Activity Tracker</h1>
            <p className="text-xs text-muted-foreground">Track your habits, build consistency</p>
          </div>
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <CalendarPicker selectedDate={selectedDate} onDateChange={setSelectedDate} />
          <div className="space-y-6">
            <ProgressBar progress={progress} />
            <ActivityManager
              weekday={weekday}
              template={template}
              onAdd={handleTemplateAdd}
              onEdit={handleTemplateEdit}
              onDelete={handleTemplateDelete}
              onMove={handleTemplateMove}
            />
          </div>
        </div>

        <Checklist
          activities={activities}
          selectedDate={selectedDate}
          onToggle={handleToggle}
          onAdd={handleDailyAdd}
          onEdit={handleDailyEdit}
          onDelete={handleDailyDelete}
          onMove={handleDailyMove}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <HistoryTable activities={activities} selectedDate={selectedDate} />
          <ProgressChart data={chartData} />
        </div>

        <ResetData onReset={handleReset} />

        <Footer />
      </main>
    </div>
  );
};

export default Index;
