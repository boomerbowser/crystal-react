/* @crystal-ui/react/blocks — composed arrangements that solve a recognisable
 * product problem: a dashboard, a checkout, a player, a storefront.
 *
 * A separate entry point because a block carries a different promise from a
 * component (implementation plan §4.2). A component's API is stable; a block is
 * opinionated by design and is a starting point products are expected to fork.
 * What a block guarantees is that the materials, motion, focus and accessibility
 * inside it are Crystal's, so forking one does not mean leaving the design
 * system. The main entry exports the same blocks, so either import works; this
 * one says which kind of thing is being imported.
 */
export * from './components/DashboardShell/index.js';
export * from './components/MetricsRow/index.js';
export * from './components/AnalyticsPanel/index.js';
export * from './components/DataTableBlock/index.js';
