import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile, useUpdateProfile } from "@/hooks/useProfile";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/PageHeader";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import DeleteAccountDialog from "@/components/DeleteAccountDialog";
import SegmentedControl from "@/components/SegmentedControl";
import { type Appearance, getAppearance, setAppearance } from "@/lib/appearance";

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
        onSuccess: () => toast({ title: "Profile saved" }),
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
      <PageHeader title="Profile" onBack={() => navigate("/")} />

      <main className="mx-auto max-w-lg px-5 pb-12 pt-4 space-y-6">
        <Card>
          <CardContent className="p-5">
            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="display-name">Display name</Label>
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
          <h2 className="px-2 text-small font-medium text-muted-foreground">Appearance</h2>
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
          <p className="px-2 text-small text-muted-foreground">Saved on this device.</p>
        </section>

        <section className="space-y-2">
          <h2 className="px-2 text-small font-medium text-muted-foreground">Account</h2>
          <Card>
            <CardContent className="space-y-4 p-5">
              <div className="space-y-1">
                <p className="text-small text-muted-foreground">Signed in as</p>
                <p className="break-all text-body font-medium">{profile?.email ?? user?.email}</p>
              </div>
              <Button variant="outline" className="w-full" onClick={handleSignOut} disabled={signingOut}>
                {signingOut ? "Signing out..." : "Sign out"}
              </Button>
              <Button
                variant="ghost"
                className="w-full text-destructive hover:bg-danger-soft hover:text-destructive"
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
