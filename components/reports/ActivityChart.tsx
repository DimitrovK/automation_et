'use client';

import type { ActivityDay } from '@/types/reports';
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

/** Day-month tick, in UTC so it renders as the intended day regardless of viewer TZ. */
function formatDay(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? iso
    : new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(d);
}

export function ActivityChart({ series, title, description }: {
  series: ActivityDay[];
  title: string;
  description: string;
}) {
  const data = series.map(row => ({ ...row, label: formatDay(row.date) }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-slate-700" />
            <XAxis dataKey="label" tick={{ fontSize: 12 }} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
            <Tooltip
              contentStyle={{ fontSize: 12 }}
              labelFormatter={label => `${label}`}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line type="monotone" dataKey="games_started" name="Started" stroke="#059669" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="games_finished" name="Finished" stroke="#2563eb" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="distinct_players" name="Players" stroke="#f59e0b" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
