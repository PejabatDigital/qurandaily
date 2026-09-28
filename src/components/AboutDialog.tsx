import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { BookOpen, Heart } from "lucide-react";

export const APP_VERSION = "1.0.0";

interface AboutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AboutDialog = ({ open, onOpenChange }: AboutDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader className="items-center text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 mb-2">
            <BookOpen className="h-7 w-7 text-primary" />
          </div>
          <DialogTitle className="text-xl">Quran Daily</DialogTitle>
          <DialogDescription>Your daily Quran reading companion</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 text-center text-sm">
          <p className="text-muted-foreground leading-relaxed">
            Set reading goals, track your progress through the Quran, and build
            a consistent daily habit. Every page brings you closer to completing
            your journey.
          </p>

          <div className="rounded-lg border bg-muted/50 p-3 space-y-1">
            <p className="text-xs text-muted-foreground">Version</p>
            <p className="font-medium">{APP_VERSION}</p>
          </div>

          <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground pt-2">
            Made with <Heart className="h-3 w-3 fill-destructive text-destructive" /> for the Ummah
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AboutDialog;
