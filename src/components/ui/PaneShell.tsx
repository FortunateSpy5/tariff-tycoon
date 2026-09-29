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
    'Poly-Grift. Prediction markets on the de-dollarization thesis. The house sets these prices and they never move — the only question is whether the house guessed your position right.',
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
    className={`h-full min-h-0 flex flex-col overflow-hidden select-none rounded-xl border border-redaction-700 bg-newsprint-950 shadow-2xl ${className}`}
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
 */
export const TabStrip: React.FC<{
  tabs: ReadonlyArray<{ id: string; label: string; shortcut: string; locked?: boolean }>;
  activeId: string;
  onSelect: (id: string) => void;
  /** Accent for the active tab. Terminal = phosphor, right deck = gold. */
  accent?: 'phosphor' | 'gold';
  className?: string;
}> = ({ tabs, activeId, onSelect, accent = 'phosphor', className = '' }) => (
  <div className={`flex shrink-0 items-center gap-1 border-b border-redaction-700 bg-redaction-700 p-1 ${className}`}>
    {tabs.map((tab) => {
      const isActive = tab.id === activeId;
      const active =
        accent === 'phosphor'
          ? 'bg-phosphor-500 text-redaction-700'
          : 'bg-gold-500 text-redaction-700';
      return (
        <button
          key={tab.id}
          onClick={() => onSelect(tab.id)}
          /* Locked tabs are STILL SELECTABLE — the body renders a SealedDossier.
             See [The Seal Is a Promise, Not a Wall]. The `locked` flag is presentational
             only; it must never be wired to `disabled`. */
          aria-pressed={isActive}
          /* INVARIANT: the visible `[1] STOCKS` text is already a sufficient
             accessible name, so only `data-hint` is written here. See `hint()`. */
          {...hint((CHANNEL_PURPOSE[tab.id] ?? UNDOCUMENTED_CHANNEL) + (tab.locked ? SEALED_SUFFIX : ''))}
          className={`flex min-w-0 flex-1 items-center justify-center gap-1 rounded px-1 py-1 text-center font-mono t-micro font-bold transition-colors ${
            isActive
              ? `${active} font-black shadow-md`
              : tab.locked
                /* Unselected + locked: visibly sealed, but still a live target. */
                ? 'text-newsprint-500 hover:bg-redaction-500 hover:text-newsprint-200'
                : 'text-newsprint-300 hover:bg-redaction-500 hover:text-newsprint-100'
          }`}
        >
          <span className="shrink-0">[{tab.shortcut}]</span>
          <span className="truncate">{tab.label}</span>
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
      accent === 'phosphor' ? 'border-phosphor-600/30 bg-newsprint-950 text-phosphor-300/70' : 'border-redaction-700 bg-redaction-700 text-newsprint-400'
    } ${className}`}
  >
    <div className="flex min-w-0 items-center gap-1.5">
      {icon}
      <span className="truncate">{label}</span>
    </div>
    {right && <div className="flex shrink-0 items-center gap-1">{right}</div>}
  </div>
);
