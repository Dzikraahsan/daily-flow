import { TrendingUp } from "lucide-react";

interface Props {
  progress: number;
}

export default function ProgressBar({ progress }: Props) {
  return (
    <div className="card-container animate-fade-in">
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold text-card-foreground">Daily Progress</h2>
      </div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-muted-foreground">Completion</span>
        <span className="text-2xl font-bold text-primary transition-all duration-500">{progress}%</span>
      </div>
      <div className="w-full h-3 bg-secondary rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500 ease-in-out"
          style={{
            width: `${progress}%`,
            background: `linear-gradient(90deg, hsl(var(--primary)), hsl(var(--primary) / 0.7))`,
          }}
        />
      </div>
    </div>
  );
}
