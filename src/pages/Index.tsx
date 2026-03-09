import { useState, useCallback, useMemo } from "react";
import { CheckCircle2 } from "lucide-react";
import CalendarPicker from "@/components/CalendarPicker";
import ProgressBar from "@/components/ProgressBar";
import Checklist from "@/components/Checklist";
import ActivityForm from "@/components/ActivityForm";
import HistoryTable from "@/components/HistoryTable";
import ProgressChart from "@/components/ProgressChart";
import {
  loadData,
  addActivity,
  deleteActivity,
  editActivity,
  toggleActivityStatus,
  calculateDailyProgress,
  getLast10DaysProgress,
  formatDate,
  type AppData,
} from "@/utils/storage";

const todayStr = formatDate(new Date());

const Index = () => {
  const [data, setData] = useState<AppData>(loadData);
  const [selectedDate, setSelectedDate] = useState(todayStr);

  const progress = useMemo(() => calculateDailyProgress(data, selectedDate), [data, selectedDate]);
  const chartData = useMemo(() => getLast10DaysProgress(data, selectedDate), [data, selectedDate]);

  const handleAdd = useCallback((name: string) => setData(addActivity(name)), []);
  const handleDelete = useCallback((id: number) => setData(deleteActivity(id)), []);
  const handleEdit = useCallback((id: number, name: string) => setData(editActivity(id, name)), []);
  const handleToggle = useCallback((id: number) => {
    setData(toggleActivityStatus(selectedDate, id));
  }, [selectedDate]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
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
        {/* Top row: Calendar + Progress */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <CalendarPicker selectedDate={selectedDate} onDateChange={setSelectedDate} />
          <div className="space-y-6">
            <ProgressBar progress={progress} />
            <ActivityForm onAdd={handleAdd} />
          </div>
        </div>

        {/* Checklist */}
        <Checklist
          activities={data.activities}
          dailyProgress={data.dailyProgress}
          selectedDate={selectedDate}
          onToggle={handleToggle}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />

        {/* Bottom row: History + Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <HistoryTable activities={data.activities} dailyProgress={data.dailyProgress} selectedDate={selectedDate} />
          <ProgressChart data={chartData} />
        </div>
      </main>
    </div>
  );
};

export default Index;
