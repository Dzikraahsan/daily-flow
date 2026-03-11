import { useState } from "react";
import { Check, Pencil, Trash2, X, Save, ListChecks, Plus, ChevronUp, ChevronDown } from "lucide-react";
import type { Activity } from "@/utils/storage";

interface Props {
  activities: Activity[];
  selectedDate: string;
  onToggle: (activityId: number) => void;
  onAdd: (name: string) => void;
  onEdit: (id: number, name: string) => void;
  onDelete: (id: number) => void;
  onMove?: (id: number, direction: "up" | "down") => void;
  isSnapshot?: boolean;
}

export default function Checklist({ activities, selectedDate, onToggle, onAdd, onEdit, onDelete, onMove, isSnapshot }: Props) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [removedIds, setRemovedIds] = useState<Set<number>>(new Set());
  const [newName, setNewName] = useState("");

  const startEdit = (a: Activity) => {
    setEditingId(a.id);
    setEditName(a.name);
  };

  const saveEdit = () => {
    if (editingId !== null && editName.trim()) {
      onEdit(editingId, editName.trim());
    }
    setEditingId(null);
  };

  const confirmDelete = (id: number) => {
    setRemovedIds((prev) => new Set(prev).add(id));
    setTimeout(() => {
      onDelete(id);
      setRemovedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      setDeletingId(null);
    }, 300);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    onAdd(newName.trim());
    setNewName("");
  };

  return (
    <div className="card-container animate-fade-in">
      <div className="flex items-center gap-2 mb-4">
        <ListChecks className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold text-card-foreground">Activity Checklist</h2>
        <span className="ml-auto text-xs text-muted-foreground">{selectedDate}</span>
      </div>

      <form onSubmit={handleAddSubmit} className="flex gap-2 items-center mb-4 w-full">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Add activity for this day only..."
          className="flex-1 min-w-0 px-4 py-2 text-sm bg-secondary rounded-lg border border-input text-card-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all duration-300"
        />
        <button
          type="submit"
          className="flex-shrink-0 px-3 py-2 bg-accent text-accent-foreground rounded-lg text-sm font-medium flex items-center gap-1.5 hover:opacity-90 transition-all duration-300 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Add
        </button>
      </form>

      {activities.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground animate-fade-in">
          <ListChecks className="w-10 h-10 mx-auto mb-2 opacity-40" />
          <p className="text-sm">No activities yet.</p>
          <p className="text-xs">Add activities via the Activity Manager or for this day only above.</p>
        </div>
      ) : (
        <div className="max-h-[300px] overflow-y-auto no-scrollbar space-y-2 pr-1">
          {activities.map((a) => {
            const isRemoving = removedIds.has(a.id);
            return (
              <div
                key={a.id}
                className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-300 hover:bg-secondary group min-w-0 overflow-hidden
                  ${isRemoving ? "opacity-0 -translate-x-4 h-0 p-0 m-0 overflow-hidden" : "opacity-100"}`}
              >
                <button
                  onClick={() => onToggle(a.id)}
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-300 flex-shrink-0
                    ${a.completed ? "bg-primary border-primary" : "border-muted-foreground/40 hover:border-primary"}`}
                >
                  {a.completed && <Check className="w-3 h-3 text-primary-foreground" />}
                </button>

                {editingId === a.id ? (
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && saveEdit()}
                      className="flex-1 min-w-0 px-2 py-1 text-sm bg-secondary rounded border border-input focus:outline-none focus:ring-2 focus:ring-ring transition-all duration-300 text-card-foreground"
                      autoFocus
                    />
                    <button onClick={saveEdit} className="p-1 text-success hover:scale-110 transition-transform flex-shrink-0">
                      <Save className="w-4 h-4" />
                    </button>
                    <button onClick={() => setEditingId(null)} className="p-1 text-muted-foreground hover:scale-110 transition-transform flex-shrink-0">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <span className={`flex-1 min-w-0 text-sm transition-all duration-300 truncate ${a.completed ? "line-through text-muted-foreground" : "text-card-foreground"}`}>
                      {a.name}
                    </span>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex-shrink-0">
                      {onMove && !isSnapshot && (
                        <>
                          <button onClick={() => onMove(a.id, "up")} className="p-1.5 rounded-md hover:bg-accent transition-all duration-200" title="Move up">
                            <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />
                          </button>
                          <button onClick={() => onMove(a.id, "down")} className="p-1.5 rounded-md hover:bg-accent transition-all duration-200" title="Move down">
                            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                          </button>
                        </>
                      )}
                      <button onClick={() => startEdit(a)} className="p-1.5 rounded-md hover:bg-accent transition-all duration-200">
                        <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                      </button>
                      {deletingId === a.id ? (
                        <div className="flex gap-1 animate-scale-in">
                          <button onClick={() => confirmDelete(a.id)} className="p-1.5 rounded-md bg-destructive/10 text-destructive hover:bg-destructive/20 transition-all duration-200 text-xs font-medium">
                            Yes
                          </button>
                          <button onClick={() => setDeletingId(null)} className="p-1.5 rounded-md hover:bg-accent transition-all duration-200 text-xs text-muted-foreground">
                            No
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => setDeletingId(a.id)} className="p-1.5 rounded-md hover:bg-destructive/10 transition-all duration-200">
                          <Trash2 className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" />
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
