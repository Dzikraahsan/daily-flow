import { useState, useCallback, useMemo, useEffect } from "react";
import { CheckCircle2 } from "lucide-react";
import CalendarPicker from "@/components/CalendarPicker";
import ProgressBar from "@/components/ProgressBar";
import Checklist from "@/components/Checklist";
import ActivityForm from "@/components/ActivityForm";
import HistoryTable from "@/components/HistoryTable";
import ProgressChart from "@/components/ProgressChart";
import {
  loadData,
  loadActivitiesForDate,
  addActivity,
  deleteActivity,
  editActivity,
  toggleActivityStatus,
  calculateDailyProgress,
  getLast10DaysProgress,
  getActivitiesForDate,
  formatDate,
  type AppData,
} from "@/utils/storage";

const todayStr = formatDate(new Date());

const Index = () => {
  const [data, setData] = useState<AppData>(() => {
    const d = loadData();
    return loadActivitiesForDate(d, todayStr);
  });
  const [selectedDate, setSelectedDate] = useState(todayStr);

  // When date changes, ensure activities are initialized (inherit if needed)
  useEffect(() => {
    setData(prev => loadActivitiesForDate({ ...prev }, selectedDate));
  }, [selectedDate]);

  const activities = useMemo(() => getActivitiesForDate(data, selectedDate), [data, selectedDate]);
  const progress = useMemo(() => calculateDailyProgress(data, selectedDate), [data, selectedDate]);
  const chartData = useMemo(() => getLast10DaysProgress(data, selectedDate), [data, selectedDate]);

  const handleAdd = useCallback((name: string) => setData(addActivity(selectedDate, name)), [selectedDate]);
  const handleDelete = useCallback((id: number) => setData(deleteActivity(selectedDate, id)), [selectedDate]);
  const handleEdit = useCallback((id: number, name: string) => setData(editActivity(selectedDate, id, name)), [selectedDate]);
  const handleToggle = useCallback((id: number) => {
    setData(toggleActivityStatus(selectedDate, id));
  }, [selectedDate]);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground leading-tight">Daily Tracker</h1>
            <p className="text-xs text-muted-foreground">Track your habits, build consistency</p>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <CalendarPicker selectedDate={selectedDate} onDateChange={setSelectedDate} />
          <div className="space-y-6">
            <ProgressBar progress={progress} />
            <ActivityForm onAdd={handleAdd} />
          </div>
        </div>

        <Checklist
          activities={activities}
          selectedDate={selectedDate}
          onToggle={handleToggle}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <HistoryTable activities={activities} selectedDate={selectedDate} />
          <ProgressChart data={chartData} />
        </div>
      </main>
    </div>
  );
};

export default Index;
