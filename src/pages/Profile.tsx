import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile, useUpdateProfile } from "@/hooks/useProfile";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import DeleteAccountDialog from "@/components/DeleteAccountDialog";
import SegmentedControl from "@/components/SegmentedControl";
import { type Appearance, getAppearance, setAppearance } from "@/lib/appearance";
import { ArrowLeft, User } from "lucide-react";

const Profile = () => {
  const { user, signOut, deleteAccount } = useAuth();
  const { data: profile } = useProfile();
  const updateProfile = useUpdateProfile();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState("");
  const [signingOut, setSigningOut] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [appearance, setAppearanceState] = useState<Appearance>(getAppearance);

  const chooseAppearance = (t: Appearance) => {
    setAppearance(t);
    setAppearanceState(t);
  };

  useEffect(() => {
    if (profile?.display_name) setDisplayName(profile.display_name);
  }, [profile?.display_name]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile.mutate(
      { display_name: displayName },
      {
        onSuccess: () => toast({ title: "Profile updated successfully!" }),
        onError: (error) => toast({ title: "Error", description: error.message, variant: "destructive" }),
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
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-lg items-center gap-3 px-4 py-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-lg font-bold tracking-tight">Profile</h1>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 py-6 space-y-6">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <User className="h-8 w-8 text-primary" />
          </div>
        </div>

        <Card>
          <CardContent className="p-4">
            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="display-name">Display Name</Label>
                <Input
                  id="display-name"
                  placeholder="Your name"
                  maxLength={50}
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full" disabled={updateProfile.isPending}>
                {updateProfile.isPending ? "Saving..." : "Save"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <section className="space-y-2">
          <h2 className="px-1 text-sm font-semibold text-foreground">Appearance</h2>
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
          <p className="px-1 text-xs text-muted-foreground">Saved on this device.</p>
        </section>

        <section className="space-y-2">
          <h2 className="px-1 text-sm font-semibold text-foreground">Account</h2>
          <Card>
            <CardContent className="space-y-4 p-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Signed in as</p>
                <p className="break-all text-sm font-medium">{profile?.email ?? user?.email}</p>
              </div>
              <Button variant="outline" className="w-full" onClick={handleSignOut} disabled={signingOut}>
                {signingOut ? "Signing out..." : "Sign out"}
              </Button>
              <Button
                variant="ghost"
                className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => setDeleteOpen(true)}
              >
                Delete my account
              </Button>
            </CardContent>
          </Card>
        </section>
      </main>

      <DeleteAccountDialog open={deleteOpen} onOpenChange={setDeleteOpen} onConfirm={handleDelete} />
    </div>
  );
};

export default Profile;
