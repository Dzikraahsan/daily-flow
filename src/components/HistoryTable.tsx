import { ClipboardList } from "lucide-react";
import type { Activity } from "@/utils/storage";

interface Props {
  activities: Activity[];
  selectedDate: string;
}

export default function HistoryTable({ activities, selectedDate }: Props) {
  return (
    <div className="card-container animate-fade-in">
      <div className="flex items-center gap-2 mb-4">
        <ClipboardList className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold text-card-foreground">
          Daily History
        </h2>
        <span className="ml-auto text-xs font-semibold text-muted-foreground">
          {selectedDate}
        </span>
      </div>

      {activities.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">
          No activities to display.
        </p>
      ) : (
        <div className="max-h-[450px] overflow-y-auto no-scrollbar">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-[12px] py-2 px-3 text-muted-foreground font-medium">
                  Activity
                </th>
                <th className="text-center text-[12px] py-2 px-3 text-muted-foreground font-medium">
                  Status
                </th>
                <th className="text-right text-[12px] py-2 px-3 text-muted-foreground font-medium">
                  Date
                </th>
              </tr>
            </thead>
            <tbody>
              {activities.map((a) => (
                <tr
                  key={a.id}
                  className="border-b border-border/50 transition-all duration-200 hover:bg-secondary/60 text-[10px]"
                >
                  <td className="py-2.5 px-3 text-card-foreground">{a.name}</td>
                  <td className="py-2.5 px-3 text-center">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium transition-all duration-300
                        ${a.completed ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}
                    >
                      {a.completed ? "Done" : "Pending"}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right text-muted-foreground text-[10px]">
                    {selectedDate}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
