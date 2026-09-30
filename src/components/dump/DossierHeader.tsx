/**
 * DossierHeader — the classified-document banner shared by all four right-deck tabs.
 *
 * DESIGN RATIONALE [B3]:
 * The D.U.M.P., Upgrades, Tariffs, and Caymans tabs each hand-wrote the same
 * `flex justify-between text-stone-500 border-b border-stone-800 pb-1.5`
 * header. Four identical copies meant the right deck never got a distinct
 * material, and any change to the header had to be made four times.
 *
 * Under the [Newsprint & Classified] direction this header is the tab's
 * identity: a black redaction bar with the section name stamped in wax red,
 * and a status tag on the right. It is what makes the right wing read as
 * government paperwork rather than a second dark terminal.
 *
 * INVARIANT: all four right-deck tabs render through <DossierHeader>.
 */

import React from 'react';

export const DossierHeader: React.FC<{
  icon?: React.ReactNode;
  title: string;
  /** Right-hand status tag, e.g. "PERMANENT SOVEREIGNTY". */
  status?: string;
}> = ({ icon, title, status }) => (
  <div className="surface-classified flex items-center justify-between gap-2 rounded-sm px-2 py-1.5 border border-term-line">
    <div className="flex min-w-0 items-center gap-1.5">
      {icon}
      <span className="t-micro font-black tracking-widest text-term-ink-1 uppercase truncate">
        {title}
      </span>
    </div>
    {status && (
      <span className="t-caption font-mono font-bold text-dead-ink uppercase shrink-0">
        {status}
      </span>
    )}
  </div>
);
