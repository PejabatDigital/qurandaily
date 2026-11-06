import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Link } from "react-router-dom";
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
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-soft mb-2">
            <BookOpen className="h-7 w-7 text-primary" />
          </div>
          <DialogTitle>Quran Daily</DialogTitle>
          <DialogDescription>Your daily Quran reading companion</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 text-center text-body">
          <p className="text-muted-foreground leading-relaxed">
            Set reading goals, track your progress through the Quran, and build
            a consistent daily habit. Every page brings you closer to completing
            your journey.
          </p>

          <div className="space-y-1 rounded-xl bg-subtle p-3">
            <p className="text-small text-muted-foreground">Version</p>
            <p className="font-medium">{APP_VERSION}</p>
          </div>

          <p className="text-small text-muted-foreground">
            <Link to="/privacy" onClick={() => onOpenChange(false)} className="underline underline-offset-2">
              Privacy
            </Link>
            <span className="px-2 opacity-70">·</span>
            <a href="mailto:hello@kasahkod.cc" className="underline underline-offset-2">
              hello@kasahkod.cc
            </a>
          </p>

          <div className="flex items-center justify-center gap-1.5 text-small text-muted-foreground pt-2">
            Made with <Heart className="h-3 w-3 fill-destructive text-destructive" /> for the Ummah
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AboutDialog;
