'use client';

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
import type { AnalyticsTimeSeriesPoint } from '@/lib/graphql/queries/admin-dashboard';

// Recharts takes color/font values as props, not Tailwind classes - these
// mirror the design tokens in frontend/app/globals.css (see the Recharts ADR
// for why a library renders its own styling instead of using our tokens directly).
const CHART_COLORS = {
  line: '#3d7a5e', // --color-status-online
  fill: '#3d7a5e', // same token, low opacity for the area under the line
  grid: '#dedad4', // --color-border-default
  axisText: '#a09890', // --color-text-muted
  label: '#2c2420', // --color-text-primary
};
const CHART_FONT_FAMILY = 'Jost, sans-serif';

function formatBucketLabel(bucket: string): string {
  return new Date(bucket).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function RegistrationsChart({ data }: { data: AnalyticsTimeSeriesPoint[] }) {
  const chartData = data.map((point) => ({ ...point, label: formatBucketLabel(point.bucket) }));

  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={chartData} margin={{ top: 8, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="registrationsFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={CHART_COLORS.fill} stopOpacity={0.15} />
            <stop offset="100%" stopColor={CHART_COLORS.fill} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={CHART_COLORS.grid} vertical={false} />
        <XAxis
          dataKey="label"
          stroke={CHART_COLORS.axisText}
          tick={{ fontFamily: CHART_FONT_FAMILY, fontSize: 11 }}
          tickLine={false}
          axisLine={{ stroke: CHART_COLORS.grid }}
        />
        <Tooltip
          contentStyle={{
            fontFamily: CHART_FONT_FAMILY,
            fontSize: 12,
            border: `1px solid ${CHART_COLORS.grid}`,
            borderRadius: 0,
          }}
          labelStyle={{ color: CHART_COLORS.label }}
          formatter={(value) => [value, 'Registrations']}
        />
        <Area
          type="monotone"
          dataKey="count"
          stroke={CHART_COLORS.line}
          strokeWidth={2}
          fill="url(#registrationsFill)"
          dot={false}
          activeDot={{ r: 4 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
