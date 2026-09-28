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
import { User, BookMarked, History, LogOut, Info, CalendarDays } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import AboutDialog from "@/components/AboutDialog";

interface AppMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AppMenu = ({ open, onOpenChange }: AppMenuProps) => {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [aboutOpen, setAboutOpen] = useState(false);

  const go = (path: string) => {
    onOpenChange(false);
    navigate(path);
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="left" className="w-64 p-0">
          <SheetHeader className="border-b p-4">
            <SheetTitle className="text-left">Quran Daily</SheetTitle>
            <SheetDescription className="sr-only">Navigation menu</SheetDescription>
          </SheetHeader>
          <nav className="flex flex-col gap-1 p-3">
            <Button variant="ghost" className="justify-start gap-3" onClick={() => go("/profile")}>
              <User className="h-4 w-4" /> Profile
            </Button>
            <Button variant="ghost" className="justify-start gap-3" onClick={() => go("/campaigns")}>
              <BookMarked className="h-4 w-4" /> Campaigns
            </Button>
            <Button variant="ghost" className="justify-start gap-3" onClick={() => go("/history")}>
              <History className="h-4 w-4" /> History
            </Button>
            <Button variant="ghost" className="justify-start gap-3" onClick={() => go("/calendar")}>
              <CalendarDays className="h-4 w-4" /> Calendar
            </Button>
            <Button
              variant="ghost"
              className="justify-start gap-3"
              onClick={() => {
                onOpenChange(false);
                setAboutOpen(true);
              }}
            >
              <Info className="h-4 w-4" /> About
            </Button>
          </nav>
          <div className="mt-auto border-t p-3">
            <Button variant="ghost" className="w-full justify-start gap-3 text-destructive" onClick={signOut}>
              <LogOut className="h-4 w-4" /> Sign Out
            </Button>
          </div>
        </SheetContent>
      </Sheet>
      <AboutDialog open={aboutOpen} onOpenChange={setAboutOpen} />
    </>
  );
};

export default AppMenu;
