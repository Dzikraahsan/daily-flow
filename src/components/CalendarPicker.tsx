import { useMemo } from "react";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";

interface Props {
  selectedDate: string;
  onDateChange: (date: string) => void;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function CalendarPicker({ selectedDate, onDateChange }: Props) {
  const date = useMemo(() => new Date(selectedDate), [selectedDate]);
  const year = date.getFullYear();
  const month = date.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const days = useMemo(() => {
    const arr: (number | null)[] = [];
    for (let i = 0; i < firstDayOfWeek; i++) arr.push(null);
    for (let i = 1; i <= daysInMonth; i++) arr.push(i);
    return arr;
  }, [firstDayOfWeek, daysInMonth]);

  const navigate = (dir: number) => {
    const d = new Date(year, month + dir, 1);
    const day = Math.min(date.getDate(), new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate());
    d.setDate(day);
    onDateChange(formatD(d));
  };

  const selectDay = (day: number) => {
    const d = new Date(year, month, day);
    onDateChange(formatD(d));
  };

  const formatD = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  const selectedDay = date.getDate();

  return (
    <div className="card-container animate-fade-in">
      <div className="flex items-center gap-2 mb-4">
        <CalendarDays className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold text-card-foreground">Calendar</h2>
      </div>

      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-lg transition-all duration-300 hover:bg-accent text-muted-foreground hover:text-accent-foreground"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="font-semibold text-card-foreground transition-all duration-300">
          {MONTHS[month]} {year}
        </span>
        <button
          onClick={() => navigate(1)}
          className="p-2 rounded-lg transition-all duration-300 hover:bg-accent text-muted-foreground hover:text-accent-foreground"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted-foreground mb-2">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
          <div key={d} className="py-1">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-sm">
        {days.map((day, i) => {
          if (day === null) return <div key={`e-${i}`} />;
          const isSelected = day === selectedDay;
          const dayStr = formatD(new Date(year, month, day));
          const isToday = dayStr === todayStr;
          return (
            <button
              key={day}
              onClick={() => selectDay(day)}
              className={`py-1.5 rounded-lg transition-all duration-200 text-sm font-medium
                ${isSelected
                  ? "bg-primary text-primary-foreground shadow-md scale-105"
                  : isToday
                    ? "bg-accent text-accent-foreground"
                    : "text-card-foreground hover:bg-secondary"
                }`}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}
