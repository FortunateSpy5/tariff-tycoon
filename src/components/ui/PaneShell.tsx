/**
 * PaneShell — the frame shared by all three cockpit wings.
 *
 * WHY THIS EXISTS [A2: Surface Drift]:
 * The three panes were hand-written divs that each declared their own
 * background, border, radius, and shadow. They looked nearly identical and were
 * not identical, which is precisely the kind of drift that makes a UI read as
 * an accumulation of components rather than a designed surface. The same drift
 * existed one level down, inside each pane's tab bodies.
 *
 * This component owns the frame. A pane supplies its tab strip and its body,
 * and inherits a consistent border, radius, shadow, and header treatment.
 *
 * INVARIANT: the three cockpit panes MUST render through <PaneShell>. Do not
 * hand-roll `h-full rounded-xl border shadow-2xl` on a pane root again.
 */

import React from 'react';
import { Lock } from 'lucide-react';
import { hint } from './hint';

/**
 * What each cockpit channel IS, keyed by tab id. A bare "STOCKS" label tells a
 * new player nothing about what the channel is for, and the two wings are
 * driven by different panes, so the copy cannot be inferred from the label.
 */
const CHANNEL_PURPOSE: Record<string, string> = {
  stocks: 'BagHolder Pro. The 0DTE desk: leveraged PUTs and CALLs, collateral locks, and settlement into whatever the last YAP broke.',
  radar: 'S.L.O.P. Radar. Live suspicion heat, raid timers, and the inquest lead who takes a bribe in crony favor.',
  // INVARIANT: [Do Not Imply Causality The Engine Denies] — `predictionSlice`
  // states in terms that this is "deliberately NOT causal" and is "a casino
  // floor bolted onto a market game"; resolution is a raw `Math.random()` roll
  // against a frozen `probYes`. The first draft said wagers were "priced by how
  // the trade war is actually resolving", which is the one claim in the whole
  // channel that the YAP loop is not built on.
  polygrift:
    'Poly-Grift. Prediction markets on the de-dollarization thesis. The house sets the price and it never moves — the only question is whether the house guessed your position right. The book explains itself in-channel; hover each slip for its odds.',
  brief: 'The Situation Room. Where the run stands, what the next milestone costs, and what is currently bleeding.',
  dump: 'The D.U.M.P. liquidation tree. Hatchet your own agency for instant cash and a permanent perk, and take a quarter of the favor price back as kickback.',
  // Corrected: the shop sells the tungsten nib, autopen interns, the diet-soda
  // drip, dark-pool fiber and the money printer — the shredder is a free desk
  // prop, not an upgrade — and `buyUpgrade` spends TREASURY CASH, not favor.
  unlocks:
    'Oligarch Lobbying Upgrades. The tungsten nib, the autopen interns, the diet-soda drip, dark-pool fiber and the money printer, bought with treasury cash. The first purchase is also what opens the tariff dials.',
  // Corrected: autopen interns and every liquidated agency also pay while the
  // tab is shut, so "the only faucet that keeps paying" was false from Phase 2.
  tariffs:
    'Bilateral tariff dials across the six parodied blocs. One faucet that needs no clicking and no attention — but it starts at zero on every run, so until you turn a dial nothing at all pays while you sleep.',
  caymans: 'Tier 1 prestige. File Chapter 11 and convert lifetime cash into permanent Sovereign Immunity Slips that outlive the reset.',
};

/** Appended to a tab whose channel is still sealed. */
const SEALED_SUFFIX =
  ' Sealed. Selecting it is free and exposes nothing — the pane shows the dossier that tells you what opens it.';

/**
 * What to say about a tab this table has never heard of.
 *
 * INVARIANT: [Never Fall Back To The Visible Label]
 * The obvious `CHANNEL_PURPOSE[tab.id] ?? tab.label` silently produces a hover
 * that is a verbatim restatement of the button's own text for any id added to a
 * tab list without a matching entry — which is precisely what the hover rule
 * forbids, and nothing would catch it. A new channel must be NAMED here, or
 * this says so out loud.
 */
const UNDOCUMENTED_CHANNEL =
  'This channel has no explanation attached yet. If a developer added this tab, they owe this string a paragraph.';

export interface PaneShellProps {
  /** Tab strip rendered in the header. Omit for a pane with no tabs. */
  header?: React.ReactNode;
  /** Main body. Should manage its own scrolling. */
  children: React.ReactNode;
  /** Footer status strip. Omit for none. */
  footer?: React.ReactNode;
  /** Extra classes on the body region (e.g. padding overrides). */
  bodyClassName?: string;
  className?: string;
}

export const PaneShell: React.FC<PaneShellProps> = ({
  header,
  children,
  footer,
  bodyClassName = 'p-2.5',
  className = '',
}) => (
  <div
    className={`h-full min-h-0 flex flex-col overflow-hidden select-none rounded-xl border border-line bg-panel shadow-sm ${className}`}
  >
    {header}
    <div className={`relative flex min-h-0 flex-1 flex-col overflow-hidden ${bodyClassName}`}>
      {children}
    </div>
    {footer}
  </div>
);

/**
 * TabStrip — the shared channel selector used by both wings.
 *
 * INVARIANT: both cockpit tab strips use this. The only difference between the
 * wings is the active-tab accent, passed as `accent` — never a forked copy of
 * this markup, which is how the two strips drifted apart in the first place.
 *
 * INVARIANT: [A Truncated Tab Name Is A Feature Nobody Asked For]
 * The right deck packs five channels into a 3/12 column, which at the 1720px cap
 * is ~65px a tab — and `[D] D.U.M.P.` next to `[U] UNLOCKS` next to `[T] TARIFFS`
 * next to `[C] CAYMANS` does not fit in 65px once the hotkey badge, the 4px gap
 * and the 8px of padding are added. Every one of them silently ellipsised to
 * `[D] D.U…`, so the deck whose job is to make four headline systems NAMABLE was
 * hiding the names of three of them.
 *
 * Three fixes were rejected. Shrinking the type step for 5+ tabs is a rule about
 * a COUNT, so adding a sixth channel re-breaks it silently. Dropping the hotkey
 * badge to make room removes information instead of abbreviating it. And a
 * viewport media query measures the wrong axis: the right deck is 3/12 and the
 * left terminal 4/12, so one breakpoint either shortens the left strip on a wide
 * monitor where its labels fit perfectly, or leaves the right strip truncated at
 * 2560px.
 *
 * What is left is a CONTAINER query, and there are three traps in it, all three
 * of which this file has already fallen into:
 *
 *   1. THE CONTAINER MUST BE THE BUTTON. `@container` without a name resolves
 *      against the NEAREST ancestor container — with the container on the strip,
 *      a 238px strip against a 92px threshold showed the long label on every tab
 *      while every tab was actually 44px wide. The tell is that BOTH spans lay
 *      out at once and the word renders as `BRIEFBRIEF`.
 *   2. THE QUERY MEASURES THE CONTENT BOX, NOT THE BORDER BOX. `clientWidth`
 *      includes the 8px of padding, so a breakpoint documented against
 *      `clientWidth` fires 8px early and silently steals the badge from tabs
 *      that had room for it.
 *   3. A `max-width` container variant SET TO `inline` HIDES NOTHING. A
 *      `<span>` is already `display: inline` by default, so that variant
 *      re-states the status quo instead of overriding it, and both labels render
 *      at every width. (Written without the literal `at max-[…px]` utility
 *      syntax: Tailwind scans raw source text for class candidates INCLUDING
 *      inside comments, so writing one out in prose makes the compiler emit a
 *      real rule for it — and a placeholder like `Npx` in that rule is a build
 *      failure, not a warning. This exact comment cost one build to discover.)
 *      Both label spans therefore need `hidden` as a BASE with the query as the
 *      override, which is what makes the two arms genuinely exclusive.
 *
 * THRESHOLDS, MEASURED NOT GUESSED. In layout px at `t-micro`, from a probe
 * rendered in the live document: badge `[C] ` = 26, gap = 4, padding = 8.
 * Longest full label is `POLY-GRIFT` (left strip) = 71; longest `short` is
 * `TARIFF` = 53. So the three bands are:
 *
 *   content >= 104  badge + FULL label   needs 26+4+71 = 101
 *   content >=  86  badge + SHORT label  needs 26+4+53 =  83
 *   below            SHORT label only    needs 53 against >= 85
 *
 * Each leaves 3px of slack, and no band is narrower than what its own content
 * requires. The numbers move with the type scale, which is why they are written
 * here next to the measurements rather than hidden in a constant.
 *
 * `container-type: inline-size` on the button is safe alongside `flex-1`: the
 * button's width comes from its flex share (basis 0%), never from its contents,
 * so `contain: inline-size` cannot feed back into the layout it is measuring.
 *
 * The full label is still the accessible name; only the visible text abbreviates,
 * and the `hint()` below is unchanged either way.
 */
export const TabStrip: React.FC<{
  tabs: ReadonlyArray<{
    id: string;
    label: string;
    /** Abbreviation used when the strip is too narrow for `label`. */
    short?: string;
    shortcut: string;
    locked?: boolean;
  }>;
  activeId: string;
  onSelect: (id: string) => void;
  /** Accent for the active tab. Terminal = phosphor, right deck = gold. */
  accent?: 'phosphor' | 'gold';
  className?: string;
}> = ({ tabs, activeId, onSelect, accent = 'phosphor', className = '' }) => (
  <div className={`flex shrink-0 items-center gap-1 border-b border-term-line bg-well-2 p-1 ${className}`}>
    {tabs.map((tab) => {
      const isActive = tab.id === activeId;
      const active =
        accent === 'phosphor'
          ? 'bg-well-2 text-term-ink-1'
          : 'bg-accent text-ink-1';
      const short = tab.short ?? tab.label;
      return (
        <button
          key={tab.id}
          onClick={() => onSelect(tab.id)}
          /* Locked tabs are STILL SELECTABLE — the body renders a SealedDossier.
             See [The Seal Is a Promise, Not a Wall]. The `locked` flag is presentational
             only; it must never be wired to `disabled`. */
          aria-pressed={isActive}
          /* INVARIANT: the visible `[1] STOCKS` text is already a sufficient
             accessible name, so only `data-hint` is written here. See `hint()`.
             The name stays honest while the visible label abbreviates, because
             `aria-label` is absent — an abbreviation is a display concern, and
             screen readers get the full `CHANNEL_PURPOSE` sentence. */
          {...hint((CHANNEL_PURPOSE[tab.id] ?? UNDOCUMENTED_CHANNEL) + (tab.locked ? SEALED_SUFFIX : ''))}
          className={`@container flex min-w-0 flex-1 items-center justify-center gap-1 rounded px-1 py-1 text-center font-mono t-micro font-bold transition-colors ${
            isActive
              ? `${active} font-black shadow-md`
              : tab.locked
                /* Unselected + locked: visibly sealed, but still a live target. */
                ? 'text-term-ink-3 hover:bg-well hover:text-term-ink-1'
                : 'text-term-ink-2 hover:bg-well hover:text-term-ink-1'
          }`}
        >
          {/* INVARIANT: [The Label Outranks The Hotkey Badge]
             The badge is the thing to lose. It is a convenience — the hotkey is
             also in the hint, and `HotkeyFooterHUD` deliberately does not repeat
             channel keys (see [This Bar Owns The Verbs. The Tabs Own The
             Channels.]). A deck that reads `BRIEF DUMP CRONY TARIFF CAYMN` is
             still a usable deck; a deck that reads `[B] [D] [U] [T] [C]` is a row
             of punctuation, and that is measurably what happens if the badge
             keeps priority — see the thresholds above. */}
          <span className="shrink-0 @max-[85px]:hidden">[{tab.shortcut}]</span>
          {/* Both spans need a `hidden` BASE, not just a query — see trap 3 in
              the header comment. With it, the two arms are exclusive: >= 104px
              shows the full label, < 104px the short one, and no width shows
              both or neither. */}
          <span className="truncate hidden @[104px]:inline">{tab.label}</span>
          <span className="truncate hidden @max-[103px]:inline">{short}</span>
          {tab.locked && <Lock className="h-2.5 w-2.5 shrink-0" aria-hidden="true" />}
        </button>
      );
    })}
  </div>
);

/**
 * StatusStrip — the shared footer row for a pane.
 *
 * Non-interactive: the label is a readout, not a control, so it carries no hint
 * of its own. Anything that IS a control in `right` is the caller's
 * responsibility and must bring its own `hint()`.
 *
 * INVARIANT: use this, do not hand-roll a footer. The left wing had one, and
 * that fork is why its two labels had drifted out of step with the right wing's.
 * Like `TabStrip`, the wings differ only by `accent` — `phosphor` for the CRT,
 * `gold` for the classified deck — never by forked markup.
 */
export const StatusStrip: React.FC<{
  icon?: React.ReactNode;
  label: string;
  right?: React.ReactNode;
  /** Label colour, so the left terminal reads phosphor and the deck gold. */
  accent?: 'phosphor' | 'gold';
  className?: string;
}> = ({ icon, label, right, accent = 'gold', className = '' }) => (
  <div
    className={`flex shrink-0 items-center justify-between border-t px-3 py-1.5 font-mono t-micro ${
      accent === 'phosphor' ? 'border-term-line-strong/30 bg-ink-1 text-term-ink-1/70' : 'border-term-line bg-well-2 text-term-ink-3'
    } ${className}`}
  >
    <div className="flex min-w-0 items-center gap-1.5">
      {icon}
      <span className="truncate">{label}</span>
    </div>
    {right && <div className="flex shrink-0 items-center gap-1">{right}</div>}
  </div>
);
