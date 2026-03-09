import { useState } from "react";
import { Plus } from "lucide-react";

interface Props {
  onAdd: (name: string) => void;
}

export default function ActivityForm({ onAdd }: Props) {
  const [name, setName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAdd(name.trim());
    setName("");
  };

  return (
    <div className="card-container animate-fade-in">
      <h2 className="text-lg font-semibold text-card-foreground mb-3">Add Activity</h2>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Activity name..."
          className="flex-1 px-4 py-2.5 text-sm bg-secondary rounded-lg border border-input text-card-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all duration-300"
        />
        <button
          type="submit"
          className="px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium flex items-center gap-1.5 hover:opacity-90 transition-all duration-300 hover:shadow-md active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Add
        </button>
      </form>
    </div>
  );
}
