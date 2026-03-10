import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { BarChart3 } from "lucide-react";

interface Props {
  data: { date: string; progress: number }[];
}

export default function ProgressChart({ data }: Props) {
  const formatted = data.map((d) => ({
    ...d,
    label: d.date.slice(5), // MM-DD
  }));

  return (
    <div className="card-container animate-fade-in">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold text-card-foreground">Progress (Last 7 Days)</h2>
      </div>

      {data.every((d) => d.progress === 0) ? (
        <p className="text-sm text-muted-foreground text-center py-10">No progress data yet. Start completing activities!</p>
      ) : (
        <div className="w-full overflow-x-auto scrollbar-thin">
          <div className="min-w-[300px] h-[300px] organetto-300">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={formatted} margin={{ top: 5, right: 20, bottom: 5, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--chart-grid))" />
                <XAxis dataKey="label" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} unit="%" />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                    fontFamily: "Organetto-Bold",
                    color: "hsl(var(--card-foreground))",
                  }}
                  formatter={(value: number) => [`${value}%`, "Progress"]}
                />
                <Line
                  type="monotone"
                  dataKey="progress"
                  stroke="hsl(var(--chart-line))"
                  strokeWidth={1.5}
                  dot={{ fill: "hsl(var(--chart-dot))", r: 4, strokeWidth: 2, stroke: "hsl(var(--card))" }}
                  activeDot={{ r: 6, strokeWidth: 2 }}
                  animationDuration={800}
                  animationEasing="ease-in-out"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
