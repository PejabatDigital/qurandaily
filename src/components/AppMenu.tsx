import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { User, BookMarked, History, Info, CalendarDays, Shield } from "lucide-react";
import AboutDialog from "@/components/AboutDialog";

interface AppMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AppMenu = ({ open, onOpenChange }: AppMenuProps) => {
  const navigate = useNavigate();
  const [aboutOpen, setAboutOpen] = useState(false);

  const go = (path: string) => {
    onOpenChange(false);
    navigate(path);
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="left" className="w-72 rounded-r-3xl p-0">
          <SheetHeader className="px-5 pb-2 pt-[max(20px,env(safe-area-inset-top))]">
            <SheetTitle className="text-left">Quran Daily</SheetTitle>
            <SheetDescription className="sr-only">Navigation menu</SheetDescription>
          </SheetHeader>
          <nav className="flex flex-col gap-0.5 px-3 pb-6">
            <Button variant="ghost" className="h-12 justify-start gap-3 rounded-xl px-3 [&_svg]:size-5 [&_svg]:text-muted-foreground" onClick={() => go("/profile")}>
              <User className="h-4 w-4" /> Profile
            </Button>
            <Button variant="ghost" className="h-12 justify-start gap-3 rounded-xl px-3 [&_svg]:size-5 [&_svg]:text-muted-foreground" onClick={() => go("/campaigns")}>
              <BookMarked className="h-4 w-4" /> Reading plans
            </Button>
            <Button variant="ghost" className="h-12 justify-start gap-3 rounded-xl px-3 [&_svg]:size-5 [&_svg]:text-muted-foreground" onClick={() => go("/history")}>
              <History className="h-4 w-4" /> History
            </Button>
            <Button variant="ghost" className="h-12 justify-start gap-3 rounded-xl px-3 [&_svg]:size-5 [&_svg]:text-muted-foreground" onClick={() => go("/calendar")}>
              <CalendarDays className="h-4 w-4" /> Calendar
            </Button>
            <Button
              variant="ghost"
              className="h-12 justify-start gap-3 rounded-xl px-3 [&_svg]:size-5 [&_svg]:text-muted-foreground"
              onClick={() => {
                onOpenChange(false);
                setAboutOpen(true);
              }}
            >
              <Info className="h-4 w-4" /> About
            </Button>
            <Button variant="ghost" className="h-12 justify-start gap-3 rounded-xl px-3 [&_svg]:size-5 [&_svg]:text-muted-foreground" onClick={() => go("/privacy")}>
              <Shield className="h-4 w-4" /> Privacy
            </Button>
          </nav>
        </SheetContent>
      </Sheet>
      <AboutDialog open={aboutOpen} onOpenChange={setAboutOpen} />
    </>
  );
};

export default AppMenu;
