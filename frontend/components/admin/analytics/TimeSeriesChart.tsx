'use client';

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
import type { AnalyticsTimeSeriesPoint } from '@/lib/graphql/queries/admin-dashboard';

// Recharts takes color/font values as props, not Tailwind classes - these
// mirror the design tokens in frontend/app/globals.css (see the Recharts ADR
// for why a library renders its own styling instead of using our tokens directly).
const GRID_COLOR = '#dedad4'; // --color-border-default
const AXIS_TEXT_COLOR = '#a09890'; // --color-text-muted
const LABEL_COLOR = '#2c2420'; // --color-text-primary
const FONT_FAMILY = 'Jost, sans-serif';

function formatBucketLabel(bucket: string): string {
  return new Date(bucket).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function TimeSeriesChart({
  data,
  color,
  seriesName,
  gradientId,
}: {
  data: AnalyticsTimeSeriesPoint[];
  color: string;
  seriesName: string;
  gradientId: string;
}) {
  const chartData = data.map((point) => ({ ...point, label: formatBucketLabel(point.bucket) }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={chartData} margin={{ top: 8, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.15} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={GRID_COLOR} vertical={false} />
        <XAxis
          dataKey="label"
          stroke={AXIS_TEXT_COLOR}
          tick={{ fontFamily: FONT_FAMILY, fontSize: 11 }}
          tickLine={false}
          axisLine={{ stroke: GRID_COLOR }}
        />
        <Tooltip
          contentStyle={{
            fontFamily: FONT_FAMILY,
            fontSize: 12,
            border: `1px solid ${GRID_COLOR}`,
            borderRadius: 0,
          }}
          labelStyle={{ color: LABEL_COLOR }}
          formatter={(value) => [value, seriesName]}
        />
        <Area
          type="monotone"
          dataKey="count"
          stroke={color}
          strokeWidth={2}
          fill={`url(#${gradientId})`}
          dot={false}
          activeDot={{ r: 4 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
