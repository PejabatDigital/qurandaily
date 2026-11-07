import { useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { BookMarked, ChevronRight, Info, LogOut, Mail, MapPin, Shield, Tag, Trash2, type LucideIcon } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile, useUpdateProfile } from "@/hooks/useProfile";
import { useCampaigns } from "@/hooks/useCampaigns";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import PageHeader from "@/components/PageHeader";
import InputField from "@/components/InputField";
import BottomBar from "@/components/BottomBar";
import { BAR_SPACE } from "@/lib/nav";
import AboutDialog, { APP_VERSION } from "@/components/AboutDialog";
import DeleteAccountDialog from "@/components/DeleteAccountDialog";
import SegmentedControl from "@/components/SegmentedControl";
import { ZonePicker } from "@/components/takwim/ZonePicker";
import { type Appearance, getAppearance, setAppearance } from "@/lib/appearance";
import { cn } from "@/lib/utils";

const Group = ({ label, note, children }: { label: string; note?: string; children: ReactNode }) => (
  <section className="space-y-2">
    <h2 className="px-1 text-small font-medium text-muted-foreground">{label}</h2>
    {children}
    {note && <p className="px-1 text-small text-muted-foreground">{note}</p>}
  </section>
);

/** A white list of rows (as WalletKu's settings), hairlines between them. */
const List = ({ children }: { children: ReactNode }) => (
  <div className="divide-y divide-border overflow-hidden rounded-2xl bg-card">{children}</div>
);

interface RowProps {
  icon?: LucideIcon;
  label: ReactNode;
  sub?: ReactNode;
  value?: ReactNode;
  danger?: boolean;
  onClick?: () => void;
  /** Shown instead of the icon, e.g. the reader's initials. */
  mark?: ReactNode;
}

const Row = ({ icon: Icon, label, sub, value, danger, onClick, mark }: RowProps) => {
  const inner = (
    <>
      {(mark || Icon) && (
        <span
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
            danger ? "bg-danger-soft text-destructive" : mark ? "bg-accent-soft" : "bg-subtle text-muted-foreground",
          )}
        >
          {mark ?? (Icon && <Icon className="h-[18px] w-[18px]" aria-hidden />)}
        </span>
      )}
      <span className="flex min-w-0 flex-1 flex-col">
        <span className={cn("truncate text-label font-medium", danger ? "text-destructive" : "text-foreground")}>
          {label}
        </span>
        {sub && <span className="truncate text-small text-muted-foreground">{sub}</span>}
      </span>
      {value !== undefined && <span className="shrink-0 text-body text-muted-foreground">{value}</span>}
      {onClick && !danger && <ChevronRight className="h-4 w-4 shrink-0 text-faint" aria-hidden />}
    </>
  );
  const cls = "flex min-h-[56px] w-full items-center gap-3 px-4 py-2 text-left";
  return onClick ? (
    <button type="button" onClick={onClick} className={cn(cls, "transition-colors active:bg-subtle")}>
      {inner}
    </button>
  ) : (
    <div className={cls}>{inner}</div>
  );
};

const initials = (name: string | undefined, email: string | undefined) => {
  const words = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (words.length) return words.slice(0, 2).map((w) => w[0].toUpperCase()).join("");
  return (email ?? "?")[0].toUpperCase();
};

/** The catch-all for what isn't used every day: profile, reading plans, prayer zone,
 *  appearance, about, privacy, contact, version, sign out and delete account. */
const Settings = () => {
  const { user, signOut, deleteAccount } = useAuth();
  const { data: profile } = useProfile();
  const { data: campaigns = [] } = useCampaigns();
  const updateProfile = useUpdateProfile();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [nameOpen, setNameOpen] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [aboutOpen, setAboutOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [appearance, setAppearanceState] = useState<Appearance>(getAppearance);

  const email = profile?.email ?? user?.email;
  const name = profile?.display_name?.trim();

  useEffect(() => {
    if (nameOpen) setDisplayName(profile?.display_name ?? "");
  }, [nameOpen, profile?.display_name]);

  const chooseAppearance = (t: Appearance) => {
    setAppearance(t);
    setAppearanceState(t);
  };

  const saveName = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile.mutate(
      { display_name: displayName },
      {
        onSuccess: () => {
          setNameOpen(false);
          toast({ title: "Name saved" });
        },
        onError: (error) => toast({ title: "Couldn't save your name", description: error.message, variant: "destructive" }),
      },
    );
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
      navigate("/");
    } catch (error) {
      toast({ title: "Couldn't sign out", description: (error as Error).message, variant: "destructive" });
      setSigningOut(false);
    }
  };

  const handleDelete = async () => {
    await deleteAccount();
    navigate("/");
    toast({ title: "Your account has been deleted." });
  };

  return (
    <div className="min-h-screen bg-background">
      <PageHeader title="Settings" />

      <main className={cn("mx-auto max-w-lg space-y-6 px-5 pt-2", BAR_SPACE)}>
        <List>
          <Row
            mark={<span className="text-small font-semibold text-primary">{initials(name, email)}</span>}
            label={name || "Add your name"}
            sub={email}
            onClick={() => setNameOpen(true)}
          />
        </List>

        <Group label="Reading">
          <List>
            <Row icon={BookMarked} label="Reading plans" value={campaigns.length} onClick={() => navigate("/campaigns")} />
          </List>
        </Group>

        <Group label="Prayer times">
          <List>
            <Row icon={MapPin} label="Prayer zone" value={<ZonePicker />} />
          </List>
        </Group>

        <Group label="Appearance" note="Saved on this device. System follows your phone.">
          <SegmentedControl
            label="Appearance"
            value={appearance}
            onChange={chooseAppearance}
            options={[
              { value: "system", label: "System" },
              { value: "light", label: "Light" },
              { value: "dark", label: "Dark" },
            ]}
          />
        </Group>

        <Group label="About">
          <List>
            <Row icon={Info} label="About Quran Daily" onClick={() => setAboutOpen(true)} />
            <Row icon={Shield} label="Privacy" onClick={() => navigate("/privacy")} />
            <Row icon={Mail} label="Contact us" sub="hello@kasahkod.cc" onClick={() => (window.location.href = "mailto:hello@kasahkod.cc")} />
            <Row icon={Tag} label="Version" value={APP_VERSION} />
          </List>
        </Group>

        <Group label="Account">
          <List>
            <Row icon={LogOut} label={signingOut ? "Signing out..." : "Sign out"} onClick={signingOut ? undefined : handleSignOut} />
            <Row icon={Trash2} label="Delete my account" danger onClick={() => setDeleteOpen(true)} />
          </List>
        </Group>

        <p className="pt-2 text-center text-caption font-medium text-muted-foreground opacity-70">{"{ kasah kod }"}</p>
      </main>

      <BottomBar current="settings" />

      <Dialog open={nameOpen} onOpenChange={setNameOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Your name</DialogTitle>
            <DialogDescription>Only you see it.</DialogDescription>
          </DialogHeader>
          <form onSubmit={saveName} className="space-y-4">
            <InputField
              label="Display name"
              placeholder="Your name"
              maxLength={50}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
            <Button type="submit" className="w-full" disabled={updateProfile.isPending}>
              {updateProfile.isPending ? "Saving..." : "Save"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
      <AboutDialog open={aboutOpen} onOpenChange={setAboutOpen} />
      <DeleteAccountDialog open={deleteOpen} onOpenChange={setDeleteOpen} onConfirm={handleDelete} />
    </div>
  );
};

export default Settings;
