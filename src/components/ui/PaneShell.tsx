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
          title={tab.locked ? `${tab.label} — sealed. Select to see what opens it.` : tab.label}
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
 * @param accent dot/icon colour so the left terminal reads phosphor and the
 *               right deck reads gold, without forking the markup.
 */
export const StatusStrip: React.FC<{
  icon?: React.ReactNode;
  label: string;
  right?: React.ReactNode;
}> = ({ icon, label, right }) => (
  <div className="flex shrink-0 items-center justify-between border-t border-redaction-700 bg-redaction-700 px-3 py-1.5 font-mono t-micro text-newsprint-400">
    <div className="flex min-w-0 items-center gap-1.5">
      {icon}
      <span className="truncate">{label}</span>
    </div>
    {right && <div className="flex shrink-0 items-center gap-1">{right}</div>}
  </div>
);
