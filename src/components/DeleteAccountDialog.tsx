import { useEffect, useState } from "react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import InputField from "@/components/InputField";

interface DeleteAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Deletes the account; a thrown error is shown in the dialog. */
  onConfirm: () => Promise<void>;
}

/** Asks for DELETE to be typed before permanently deleting the account. */
const DeleteAccountDialog = ({ open, onOpenChange, onConfirm }: DeleteAccountDialogProps) => {
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setTyped("");
      setError(null);
    }
  }, [open]);

  const confirm = async () => {
    setBusy(true);
    setError(null);
    try {
      await onConfirm();
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={(o) => !busy && onOpenChange(o)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete your account?</AlertDialogTitle>
          <AlertDialogDescription>
            This permanently deletes your account, all your reading plans and reading logs, on every device. It can't
            be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <InputField
          label="Type DELETE to confirm"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          value={typed}
          error={error}
          onChange={(e) => setTyped(e.target.value)}
        />
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
          <Button variant="destructive" disabled={typed.trim() !== "DELETE" || busy} onClick={confirm}>
            {busy ? "Deleting..." : "Delete my account"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteAccountDialog;
