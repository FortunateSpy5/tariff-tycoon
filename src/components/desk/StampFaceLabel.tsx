/**
 * StampFaceLabel — the lettering laid over the rubber, as real HTML.
 *
 * WHY THIS IS NOT DRAWN INTO THE SVG
 * An SVG `<text>` cannot be selected, cannot be read by a screen reader, and
 * cannot pick up the `t-stamp-*` scale that makes the face legible when the
 * stamp shrinks. The yield tag in particular is not decoration — it is the
 * number the player plans their whole session around — so it has to be real
 * text that the assistive layer can reach and the type scale can size.
 *
 * INVARIANT: [The Label Sits On The Rubber, Not On Metal]
 * `StampIllustration` places the rubber ellipse at (100, 118) of a 200-unit
 * viewBox. This label is a flex column centred in the button, which puts its
 * optical centre near (100, 100) — roughly 18 units high of the face. The
 * offset is deliberate and small: nudging the label down to sit exactly on the
 * rubber's centre would push the yield tag off the bottom of the disc, and the
 * tag outranks the plate name for the player's attention.
 *
 * INVARIANT: [Every Size Here Is Stamp-Relative]
 * The four tiers come from the type scale's stamp block in `index.css`, which is
 * expressed in `cqw` against the button's own `container-type: size`. The
 * stamp is the one control in the app whose size is not fixed — it takes
 * whatever the zero-scroll desk column leaves it, which ranges from ~250px in
 * steady state to ~70px while a crisis is ringing. Fixed pixel text on a
 * 70px disc is a smudge, and a smudged hero number is worse than a small one.
 */

import React from 'react';
import { formatCurrency } from '../../engine/math/bigNumber';
import { CUSTOMS_STAMP_NAME } from '../../constants/setting';
import { hint } from '../ui/hint';

interface StampFaceLabelProps {
  /** The charged yield for this slam, already formatted by the engine. */
  clickValue: number;
  isPhase1: boolean;
  isDry: boolean;
  /** Damped slam at high tantrum — see the C1 note in `ClickerButton`. */
  isRecoilActive: boolean;
  /** The full hint for the yield tag. */
  yieldHint: string;
}

export const StampFaceLabel: React.FC<StampFaceLabelProps> = ({
  clickValue,
  isPhase1,
  isDry,
  isRecoilActive,
  yieldHint,
}) => {
  /* INVARIANT: [Each Tier Takes The Ink Of THE SURFACE IT SITS ON]
     These three lines are not all on the same background, and treating them as
     though they were is how the plate line spent a year invisible.

     The verb and the yield sit on the rubber, which is dark on purpose — ink-
     stained rubber never takes a highlight, and it is the surface the type has
     to sit on. They take the screen's ink. The PLATE sits above the rubber on
     the shoulder, which is metal, and metal is light. When the button still
     carried its own 320px dark disc the shoulder read dark too and the plate
     was legible; the moment the disc was removed and the desk showed through,
     light-on-light went to roughly 1.9:1 and the stamp lost its own name.

     So the plate takes the PAPER ink and the other two keep the screen ink. This
     is the cross-material bug in miniature, and it is the reason the palette
     defines two ink ladders rather than one. */

  /* INVARIANT: [Three Tiers, And Three Is The Whole Budget]
     This label used to lay six things on the rubber: a Lucide icon, the plate
     name, the verb, a bracketed attribution, a pill-shaped yield chip with a
     second icon inside it, and a CAPS LOCK flag. Every one of them was
     individually defensible and together they were the "too busy" — six
     competing elements on a 300px disc, three of them boxed or iconographic,
     all asking for attention at once.

     Cut, in this order:
       - the ICON. The object is a drawn rubber stamp. A glyph of a stamp
         sitting on a stamp is the redundancy the illustration exists to remove.
       - the SUBTITLE ("[BY AGENT 412]" / "24k Golden Sherpie"). Pure flavour,
         zero information, and it was the second-largest tier on the face.
       - the CAPS LOCK flag. The cockpit washes the whole window red, the
         metal turns red, and the button itself throbs. Three signals for one
         state, on the one object the player is staring at while it happens.
       - the CHIP. A rounded rect with a border, containing another icon, on
         the face of a circle that is already inside a card. It read as a
         button inside a button. The number keeps its hint; it loses the box.

     What is left earns its place: what the stamp IS, what it DOES, and what
     it pays. Identity, action, yield — in that order of size, top to bottom. */

  return (
    <div className="relative z-10 flex flex-col items-center text-center drop-shadow-[0_1px_1px_rgba(0,0,0,0.85)]">
      <span className="t-stamp-plate font-mono font-bold uppercase tracking-[0.24em] text-ink-3">
        {isPhase1 ? CUSTOMS_STAMP_NAME : 'Resolute Desk'}
      </span>

      {/* INVARIANT: [The Verb On The Stamp Must Be True] — see `ClickerButton`.
          A dry Phase 2+ nib reads DRY SCRATCH, which is what it does; the ink
          rules and the jam threshold are in that button's hint. */}
      <span
        className={`t-stamp-verb font-black uppercase tracking-[0.06em] mt-[3cqw] text-term-ink-1 ${
          isRecoilActive ? 'animate-recoil' : ''
        }`}
      >
        {isPhase1 ? 'CONFISCATE' : isDry ? 'DRY SCRATCH' : 'SIGN ORDER'}
      </span>

      {/* The yield. The one number on this object that is a HUD rather than
          decoration, and therefore the only tier carrying a hint of its own.
          No box, no icon: the weight and the colour are what make it read as
          the live number on a dead rubber disc. */}
      <span
        {...hint(yieldHint)}
        className="theme-allow t-stamp-tag font-mono font-bold text-live-soft whitespace-nowrap mt-[7cqw]"
      >
        +{formatCurrency(clickValue)} / tap
      </span>
    </div>
  );
};
