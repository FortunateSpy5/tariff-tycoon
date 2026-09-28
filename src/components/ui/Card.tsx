/**
 * Card Primitive — the single surface primitive for the whole cockpit.
 *
 * INVARIANT: [One Card, One Padding, One Radius]
 * Before this component the codebase had 4 distinct paddings (p-2 / p-2.5 /
 * p-3 / p-4) and 3 radii (rounded / rounded-lg / rounded-xl) applied ad hoc to
 * visually identical panels. That drift is what made the UI read as a pile of
 * components rather than a designed surface. New UI MUST use <Card> or a
 * variant of it; do not reintroduce one-off padding utilities on panels.
 *
 * Material variants map to the [Newsprint & Classified] design direction:
 *   - 'term'     phosphor CRT screen   (BagHolder Pro, S.L.O.P. Radar, telemetry)
 *   - 'paper'    aged newsprint        (directives, objectives, certificates)
 *   - 'panel'    neutral office chrome (the three cockpit panes)
 *   - 'classified' redacted black bar  (seal headers, raid banners)
 */

import React from 'react';

export type CardMaterial = 'panel' | 'term' | 'paper' | 'classified';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  material?: CardMaterial;
  /**
   * Visual density.
   *   'tight'   p-2   — list rows, gauge rows
   *   'default' p-2.5 — content blocks
   *   'flush'   p-0   — hero surfaces that manage their own inner padding
   *                     (e.g. a full-bleed heat gauge that must reach the edges)
   */
  density?: 'tight' | 'default' | 'flush';
  /** Optional accent rule along the top edge (amber for money, green for terminal). */
  accent?: 'gold' | 'phosphor' | 'red' | 'none';
  children?: React.ReactNode;
}

const MATERIAL_CLASS: Record<CardMaterial, string> = {
  panel: 'bg-stone-900/95 border-stone-800',
  term: 'surface-terminal border-phosphor-600/35',
  paper: 'surface-newsprint border-newsprint-300',
  classified: 'surface-classified border-stone-950',
};

const DENSITY_CLASS = {
  tight: 'p-2',
  default: 'p-2.5',
  flush: 'p-0',
} as const;

const ACCENT_CLASS = {
  gold: 'before:bg-gold-500',
  phosphor: 'before:bg-phosphor-500',
  red: 'before:bg-red-500',
  none: '',
} as const;

export const Card: React.FC<CardProps> = ({
  material = 'panel',
  density = 'default',
  accent = 'none',
  className = '',
  children,
  ...rest
}) => {
  return (
    <div
      className={`relative rounded-lg border ${MATERIAL_CLASS[material]} ${DENSITY_CLASS[density]} ${
        accent !== 'none' ? 'before:absolute before:left-2 before:right-2 before:top-0 before:h-px before:content-[""]' : ''
      } ${ACCENT_CLASS[accent]} ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
};

/**
 * CardHeader — a printed section label with an optional right-hand slot.
 * Uses the shared type scale instead of ad-hoc `t-micro font-mono`.
 */
export const CardHeader: React.FC<{
  title: string;
  icon?: React.ReactNode;
  right?: React.ReactNode;
  className?: string;
}> = ({ title, icon, right, className = '' }) => (
  <div className={`flex items-center justify-between gap-2 mb-1.5 ${className}`}>
    <div className="flex items-center gap-1.5 min-w-0">
      {icon}
      <span className="t-micro font-bold tracking-widest uppercase truncate">{title}</span>
    </div>
    {right}
  </div>
);
