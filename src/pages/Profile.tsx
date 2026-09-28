import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, User } from "lucide-react";

const TIMEZONES = [
  "UTC",
  "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles",
  "America/Anchorage", "America/Toronto", "America/Vancouver", "America/Mexico_City",
  "America/Bogota", "America/Sao_Paulo", "America/Argentina/Buenos_Aires",
  "Europe/London", "Europe/Paris", "Europe/Berlin", "Europe/Madrid", "Europe/Rome",
  "Europe/Amsterdam", "Europe/Brussels", "Europe/Zurich", "Europe/Stockholm",
  "Europe/Moscow", "Europe/Istanbul",
  "Africa/Cairo", "Africa/Lagos", "Africa/Johannesburg", "Africa/Nairobi", "Africa/Casablanca",
  "Asia/Dubai", "Asia/Riyadh", "Asia/Tehran", "Asia/Karachi", "Asia/Kolkata",
  "Asia/Dhaka", "Asia/Bangkok", "Asia/Jakarta", "Asia/Singapore", "Asia/Kuala_Lumpur",
  "Asia/Shanghai", "Asia/Hong_Kong", "Asia/Tokyo", "Asia/Seoul", "Asia/Manila",
  "Australia/Sydney", "Australia/Melbourne", "Australia/Perth",
  "Pacific/Auckland", "Pacific/Fiji", "Pacific/Honolulu",
];

const Profile = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState("");
  const [timezone, setTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("display_name, timezone")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        if (data?.display_name) setDisplayName(data.display_name);
        if (data?.timezone) setTimezone(data.timezone);
      });
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    const { error } = await supabase
      .from("profiles")
      .update({ display_name: displayName, timezone })
      .eq("user_id", user.id);
    setLoading(false);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else toast({ title: "Profile updated successfully!" });
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
          <p className="text-sm text-muted-foreground">{user?.email}</p>
        </div>

        <Card>
          <CardContent className="p-4">
            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-2">
                <Label>Email Address</Label>
                <Input value={user?.email ?? ""} readOnly className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label>Display Name</Label>
                <Input
                  placeholder="Your name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Timezone</Label>
                <Select value={timezone} onValueChange={setTimezone}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select timezone" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIMEZONES.map((tz) => (
                      <SelectItem key={tz} value={tz}>
                        {tz.replace(/_/g, " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Saving..." : "Save"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Button variant="outline" className="w-full" onClick={signOut}>
          Sign Out
        </Button>
      </main>
    </div>
  );
};

export default Profile;
