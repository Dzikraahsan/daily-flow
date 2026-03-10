import { useState } from "react";
import { Trash2, AlertTriangle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { resetAllData } from "@/utils/storage";

interface Props {
  onReset: () => void;
}

export default function ResetData({ onReset }: Props) {
  return (
    <div className="card-container animate-fade-in border-destructive/50">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="w-5 h-5 text-destructive" />
        <h2 className="text-lg font-semibold text-card-foreground">Reset Application Data</h2>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        This will permanently delete all your activities, progress history, and weekday templates. This action cannot be undone.
      </p>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <button className="px-4 py-2.5 bg-destructive text-destructive-foreground rounded-lg text-sm font-medium flex items-center gap-2 hover:opacity-90 transition-all duration-300 active:scale-95">
            <Trash2 className="w-4 h-4" />
            Delete All Data
          </button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete all data?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. All weekday templates, daily overrides, and progress history will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                resetAllData();
                onReset();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete All Data
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
