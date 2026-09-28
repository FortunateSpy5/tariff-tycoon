/**
 * Barrel export for Executive Desk components.
 *
 * REDESIGN: InkMeter and TantrumMeter were replaced by <ExecutiveGauges>, which
 * stacks them as a matched pair and gives the Tantrum meter a Vent action. The
 * old pair was a grid-cols-2 where only Ink had a button, which read as one
 * finished component beside one that was missing its affordance.
 */

export { ClickerButton } from './ClickerButton';
export { ResoluteBlotterCenter } from './ResoluteBlotterCenter';
export { ExecutiveGauges } from './ExecutiveGauges';
export { FeedbackLayer } from './FeedbackLayer';
export { resolveFeedback } from './feedbackPriority';
