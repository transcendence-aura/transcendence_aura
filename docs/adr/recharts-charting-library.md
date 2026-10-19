# Charting: Recharts, Not In-House

## Context

The admin dashboard needs charts (registrations over time, and more later).
Every other piece of UI in this project — buttons, dialogs, tables, form
inputs — is hand-built against the design system (see
[design_system.md](../design_system.md)), not pulled from a component
library. That choice is deliberate: the design module of this project
evaluates the component library itself, so it stays custom-built.

A chart is a different kind of problem. Rendering a line/bar/pie chart from
a data series involves SVG scale math (mapping data values to pixel
coordinates), axis tick generation, responsive resizing, and interaction
handling (hover tooltips, active points). None of that is specific to this
project's design — it's the same math for every chart, on every site.
Reimplementing it would spend time on a solved problem with no pedagogical
or scoring value, at the cost of time that could go into the parts that
are actually evaluated.

## Decision

**Use [Recharts](https://recharts.github.io/en-US/) for charts. Keep every
other UI component hand-built.**

Recharts was picked over the alternatives for this project specifically:

- **Chart.js / D3**: lower-level, canvas-based (Chart.js) or a full
  visualization toolkit (D3) — both need more glue code to get a single
  chart on screen than this project needs.
- **Recharts**: React-native (components, not an imperative API), built on
  SVG (inspectable/stylable like the rest of the DOM), and its charts are
  built by composing small components (`<AreaChart>`, `<XAxis>`,
  `<Tooltip>`, ...) rather than one large config object — the closest fit
  to how the rest of this codebase is written.

**Charts still use this project's design tokens, not Recharts' defaults.**
Recharts takes colors and fonts as props (`stroke`, `fill`,
`tick={{ fontFamily }}`), not Tailwind classes, so a chart component reads
the same hex values defined in `frontend/app/globals.css`
(`--color-status-online`, `--color-border-default`, `--color-text-muted`)
and the same `Jost` font family, instead of Recharts' own blue/green
palette. See `components/admin/dashboard/RegistrationsChart.tsx` for the
first example.

## Consequences

**Positive**

- No time spent reimplementing SVG scale math, axis rendering, or resize
  handling — a solved problem stays solved.
- Charts still look native to the app: no visible seam between hand-built
  components and library-rendered ones, because colors/fonts always come
  from the same token set.
- Recharts' component-per-piece API (`<XAxis>`, `<Tooltip>`, `<Area>`)
  matches this codebase's existing pattern of small, composable components.

**Trade-offs**

- One more third-party dependency, with its own bundle size and update
  cadence, unlike the rest of the UI which has none.
- Anything a chart needs to do that Recharts doesn't support out of the box
  requires working within its API rather than changing arbitrary internal
  code, the way an in-house component can be changed freely.
