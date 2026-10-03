'use client';

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { TopWishlistedProduct } from '@/lib/graphql/queries/admin-analytics';

// See TimeSeriesChart.tsx - same reasoning for passing tokens as props here.
const BAR_COLOR = '#dc9b9b'; // --color-brand-accent
const GRID_COLOR = '#dedad4'; // --color-border-default
const AXIS_TEXT_COLOR = '#a09890'; // --color-text-muted
const LABEL_COLOR = '#2c2420'; // --color-text-primary
const FONT_FAMILY = 'Jost, sans-serif';

export function TopWishlistedChart({ data }: { data: TopWishlistedProduct[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 8, right: 16, left: 0, bottom: 0 }}
        barCategoryGap={12}
      >
        <CartesianGrid stroke={GRID_COLOR} horizontal={false} />
        <XAxis
          type="number"
          allowDecimals={false}
          stroke={AXIS_TEXT_COLOR}
          tick={{ fontFamily: FONT_FAMILY, fontSize: 11 }}
          tickLine={false}
          axisLine={{ stroke: GRID_COLOR }}
        />
        <YAxis
          type="category"
          dataKey="name"
          stroke={AXIS_TEXT_COLOR}
          tick={{ fontFamily: FONT_FAMILY, fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          width={140}
        />
        <Tooltip
          contentStyle={{
            fontFamily: FONT_FAMILY,
            fontSize: 12,
            border: `1px solid ${GRID_COLOR}`,
            borderRadius: 0,
          }}
          labelStyle={{ color: LABEL_COLOR }}
          formatter={(value) => [value, 'Wishlist adds']}
        />
        <Bar dataKey="wishlistAdds" fill={BAR_COLOR} radius={0} maxBarSize={18} />
      </BarChart>
    </ResponsiveContainer>
  );
}
