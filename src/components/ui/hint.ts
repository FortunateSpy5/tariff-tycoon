/**
 * `hint()` — the attribute pair every operable element in the cockpit spreads.
 *
 * WHY THIS IS NOT IN `HintTooltip.tsx`
 * That file exports `<HintLayer>`, a component. This repo's rule is that a
 * component module exports components only, so that React Fast Refresh works in
 * development — a module mixing `export function hint()` with `export const
 * HintLayer` makes every edit to one of them remount the other. The rule is
 * enforced by `oxlint`'s `react/only-export-components`.
 *
 * INVARIANT: [Hover Text And Accessible Name Are Written Together]
 * The audit found 18 operable elements with neither, and 12 more carrying a bare
 * `title` — which is not an accessible name and does not appear on touch. Writing
 * both through one call is the only way they stop drifting apart again.
 */

/** Attribute read by `<HintLayer>`. Written by `hint()`. */
export const HINT_ATTR = 'data-hint';

export interface HintAttrs {
  'data-hint': string;
  'aria-label'?: string;
}

/**
 * Props for an element that must explain itself.
 *
 * @param text Hover and focus text. Explains MECHANISM and STAKES — never a
 *             restatement of the visible label.
 * @param name Accessible name. Supply it when the visible text is cryptic
 *             (`100x`, `$1k`, `+25%`) or absent (an icon-only button). Omit it
 *             when the visible text already names the control.
 */
export function hint(text: string, name?: string): HintAttrs {
  return name === undefined ? { [HINT_ATTR]: text } : { [HINT_ATTR]: text, 'aria-label': name };
}
