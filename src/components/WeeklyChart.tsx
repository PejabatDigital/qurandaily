import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ChartDataPoint {
  day: string;
  pages: number;
}

interface WeeklyChartProps {
  data7: ChartDataPoint[];
  data30: ChartDataPoint[];
}

const WeeklyChart = ({ data7, data30 }: WeeklyChartProps) => {
  const [range, setRange] = useState<"7" | "30">("7");
  const data = range === "7" ? data7 : data30;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">Reading Activity</CardTitle>
        <div className="flex gap-1">
          <Button
            variant={range === "7" ? "default" : "ghost"}
            size="sm"
            className="h-7 px-2.5 text-xs"
            onClick={() => setRange("7")}
          >
            7D
          </Button>
          <Button
            variant={range === "30" ? "default" : "ghost"}
            size="sm"
            className="h-7 px-2.5 text-xs"
            onClick={() => setRange("30")}
          >
            30D
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[180px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="day"
                tick={{ fontSize: range === "30" ? 10 : 12 }}
                stroke="hsl(var(--muted-foreground))"
                interval={range === "30" ? 4 : 0}
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
                dot={range === "7" ? { r: 4, fill: "hsl(var(--primary))" } : false}
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
