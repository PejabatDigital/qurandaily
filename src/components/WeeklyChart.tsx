import { useState } from "react";
import { format } from "date-fns";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { ActivityDay } from "@/lib/activity";

type Range = "7" | "30" | "all";

const RANGES: { value: Range; label: string }[] = [
  { value: "7", label: "7D" },
  { value: "30", label: "30D" },
  { value: "all", label: "All" },
];

interface WeeklyChartProps {
  /** Every day of the reading plan, oldest first. */
  activity: ActivityDay[];
}

const WeeklyChart = ({ activity }: WeeklyChartProps) => {
  const [range, setRange] = useState<Range>("7");
  const shown = range === "all" ? activity : activity.slice(-Number(range));
  const data = shown.map((a) => ({ day: format(a.date, range === "7" ? "EEE" : "d MMM"), pages: a.pages }));
  const compact = data.length > 7;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">Reading Activity</CardTitle>
        <div className="flex gap-1">
          {RANGES.map((r) => (
            <Button
              key={r.value}
              variant={range === r.value ? "default" : "ghost"}
              size="sm"
              className="h-7 px-2.5 text-xs"
              onClick={() => setRange(r.value)}
            >
              {r.label}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[180px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="day"
                tick={{ fontSize: compact ? 10 : 12 }}
                stroke="hsl(var(--muted-foreground))"
                // About six date labels, however many days are shown
                interval={compact ? Math.ceil(data.length / 6) - 1 : 0}
              />
              <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Line
                type="monotone"
                dataKey="pages"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={compact ? false : { r: 4, fill: "hsl(var(--primary))" }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default WeeklyChart;
