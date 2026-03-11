import { useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Save,
  X,
  Settings2,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import type { WeekdayTemplate } from "@/utils/storage";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Props {
  weekday: string;
  template: WeekdayTemplate[];
  onAdd: (name: string) => void;
  onEdit: (id: number, name: string) => void;
  onDelete: (id: number) => void;
  onMove: (id: number, direction: "up" | "down") => void;
}

export default function ActivityManager({
  weekday,
  template,
  onAdd,
  onEdit,
  onDelete,
  onMove,
}: Props) {
  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<{
    id: number;
    name: string;
  } | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAdd(name.trim());
    setName("");
  };

  const saveEdit = () => {
    if (editingId !== null && editName.trim()) {
      onEdit(editingId, editName.trim());
    }
    setEditingId(null);
  };

  return (
    <div className="card-container animate-fade-in">
      <div className="flex items-center gap-2 mb-4">
        <Settings2 className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold text-card-foreground">
          Activity Manager
        </h2>
        <span className="ml-auto text-xs font-medium px-2 py-1 rounded-full bg-accent text-accent-foreground">
          {weekday}
        </span>
      </div>

      <form onSubmit={handleSubmit} className="flex items-center gap-2 mb-4 w-full">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="New activity name..."
          className="flex-1 min-w-0 px-4 py-2.5 text-sm bg-secondary rounded-lg border border-input text-card-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all duration-300"
        />
        <button
          type="submit"
          className="flex-shrink-0 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium flex items-center gap-1.5 hover:opacity-90 transition-all duration-300 hover:shadow-md active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Add
        </button>
      </form>

      {template.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          No activities in the {weekday} template yet.
        </p>
      ) : (
        <div className="max-h-[250px] overflow-y-auto hide-scrollbar no-scrollbar space-y-1.5 pr-1">
          {template.map((a) => (
            <div
              key={a.id}
              className="flex items-center gap-3 p-2.5 rounded-lg transition-all duration-300 hover:bg-secondary group min-w-0 overflow-hidden"
            >
              {editingId === a.id ? (
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && saveEdit()}
                    className="flex-1 min-w-0 px-2 py-1 text-sm bg-secondary rounded border border-input focus:outline-none focus:ring-2 focus:ring-ring transition-all duration-300 text-card-foreground"
                    autoFocus
                  />
                  <button
                    onClick={saveEdit}
                    className="p-1 text-success hover:scale-110 transition-transform flex-shrink-0"
                  >
                    <Save className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="p-1 text-muted-foreground hover:scale-110 transition-transform flex-shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <>
                  <span className="flex-1 min-w-0 text-sm text-card-foreground truncate">
                    {a.name}
                  </span>
                  <div className="flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200 flex-shrink-0">
                    <button
                      onClick={() => onMove(a.id, "up")}
                      className="p-1.5 rounded-md hover:bg-accent transition-all duration-200"
                      title="Move up"
                    >
                      <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                    <button
                      onClick={() => onMove(a.id, "down")}
                      className="p-1.5 rounded-md hover:bg-accent transition-all duration-200"
                      title="Move down"
                    >
                      <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                    <button
                      onClick={() => {
                        setEditingId(a.id);
                        setEditName(a.name);
                      }}
                      className="p-1.5 rounded-md hover:bg-accent transition-all duration-200"
                    >
                      <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                    <button
                      onClick={() =>
                        setDeleteTarget({ id: a.id, name: a.name })
                      }
                      className="p-1.5 rounded-md hover:bg-destructive/10 transition-all duration-200"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete from {weekday} template?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove "{deleteTarget?.name}" from the {weekday}{" "}
              template and all existing {weekday} dates. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteTarget) onDelete(deleteTarget.id);
                setDeleteTarget(null);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Globally
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
