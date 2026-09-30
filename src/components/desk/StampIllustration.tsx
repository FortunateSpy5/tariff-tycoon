/**
 * StampIllustration — the hero object: a layered SVG of the Phase 1 customs
 * rubber stamp and the Phase 2+ Golden Sherpie.
 *
 * WHY THIS IS AN SVG AND NOT MORE DIVS [2.3]
 * The stamp was a `rounded-full` div with a Lucide icon in it. It is the single
 * most screenshot-worthy asset in a game about slamming a rubber stamp, and it
 * was the flattest thing on screen — a coloured circle. An SVG gets the parts
 * that make an object read as an object: a barrel with a gradient, a shoulder
 * that catches the light, grip rings, a rubber face that is permanently
 * ink-stained, and a cast shadow that puts it ON the desk rather than floating
 * in front of it.
 *
 * INVARIANT: [The Composition Is Built Around The Text, Not The Other Way Round]
 * The face is a large ellipse centred at (100, 118) in the 200-unit viewBox,
 * and the button's four lines of lettering are laid out over it — because on a
 * real rubber stamp the text IS on the face. An earlier draft centred the whole
 * object and shrank the face to a disc at the bottom, which left the lettering
 * straddling bare metal: readable as text, illegible as an object.
 *
 * INVARIANT: [The Face Must Stay Inside The Circle]
 * The button is `rounded-full`, so the viewBox's corners are transparent. Every
 * drawn element has to sit inside the inscribed circle, or the stamp is visibly
 * cropped by its own button. The face ellipse is (rx 92, ry 58) at (100, 118),
 * which is the largest ellipse that clears the circle at every point — its
 * furthest point from the circle's centre is at radius 94.9 against a radius of
 * 100. Widening rx or moving cy down crops the face on the bottom corners.
 *
 * INVARIANT: [The Illustration Is Decoration; The Numbers Are Not]
 * Every readable string on the stamp face — the plate name, the verb, the
 * qualifier, the yield tag — is real HTML layered over this SVG by
 * `StampFaceLabel`, never drawn into it. An SVG `<text>` cannot be selected,
 * cannot be read by a screen reader, and cannot be restyled by the `t-stamp-*`
 * scale that the stamp's legibility now depends on. This file carries the
 * object; the HTML carries the words.
 *
 * INVARIANT: [It Must Not Cost The Click Target]
 * The SVG is `pointer-events-none` and `aria-hidden`. The button wrapping it is
 * unchanged in semantics — this is a coat of paint on a control that already
 * worked, and a hero control that stopped responding because an illustration
 * intercepted its click would be a catastrophic trade for a prettier circle.
 *
 * INVARIANT: [Nothing In Here Animates]
 * The slam is a CSS animation on the button (`stamp-slam`), tuned against the
 * C1 damping work. A second transform on an inner element would compose with
 * those and reintroduce the judder that pass removed.
 */

import React from 'react';

/** Which face the stamp is wearing. Drives colour and silhouette. */
export type StampFace = 'customs' | 'sherpie';

export const StampIllustration: React.FC<{ face: StampFace; isFrenzy: boolean }> = ({
  face,
  isFrenzy,
}) => {
  const isSherpie = face === 'sherpie';

  /* INVARIANT: [The Barrel Is Metal. Metal Is Not A Colour.]
     The barrel, the shoulder and the cap were previously filled with the same
     saturated family hue as the ink, which turned a 300px brass-and-aluminium
     object into a flat coloured disc — the single loudest thing on a warm
     ground, in a hue that had no other job in the app.

     A real stamp's barrel is metal. It has no opinion. The family's job is
     done by the INK, which is the one part of a stamp that genuinely takes
     colour, and it is done twice — pooled on the rubber's leading edge, and as
     a thin rim around the face. So the object reads as an object, the three
     states stay distinguishable at a glance, and the loudest surface on screen
     is no longer the hero.

     This is also the subtractive rule applied literally: a large area does its
     work most quietly, and the small bright areas stand out most vividly. */
  const metal = ['var(--color-panel)', 'var(--color-line)', 'var(--color-ink-4)'];

  // The ink colour that stains the rubber and rims the face. Phase 1 is a blue
  // customs stamp; Phase 2+ is a gold one. Frenzy bleeds the Phase 1 rubber too
  // — the tantrum is not phased.
  const ink = isFrenzy ? 'var(--color-dead)' : isSherpie ? 'var(--color-accent)' : 'var(--color-signal)';

  return (
    <svg
      viewBox="0 0 200 200"
      aria-hidden="true"
      focusable="false"
      className="absolute inset-0 h-full w-full pointer-events-none"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        {/* The barrel: a vertical gradient so the cylinder turns. */}
        <linearGradient id="stamp-barrel" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={metal[0]} />
          <stop offset="40%" stopColor={metal[1]} />
          <stop offset="100%" stopColor={metal[2]} />
        </linearGradient>

        {/* The shoulder: the chamfer where the barrel flares out to the face. */}
        <linearGradient id="stamp-shoulder" x1="0" y1="0" x2="0.2" y2="1">
          <stop offset="0%" stopColor={metal[0]} stopOpacity="0.9" />
          <stop offset="55%" stopColor={metal[1]} stopOpacity="0.75" />
          <stop offset="100%" stopColor={metal[2]} stopOpacity="0.55" />
        </linearGradient>

        /* A hard specular streak down the barrel. This is what actually sells
           "cylinder": a vertical gradient alone still reads flat, because a
           real metal edge has one bright line and one dark line, not a wash. */
        <linearGradient id="stamp-specular" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="26%" stopColor="#ffffff" stopOpacity="0.5" />
          <stop offset="44%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>

        /* The rubber. Always dark, whatever the barrel is: ink-stained rubber
           is the one part of a stamp that never takes a highlight, and it is
           also the surface the lettering has to sit on, so it is dark on
           purpose rather than for realism. */
        <radialGradient id="stamp-rubber" cx="0.5" cy="0.3" r="0.85">
          <stop offset="0%" stopColor="#4c3a28" />
          <stop offset="55%" stopColor="#2a1e13" />
          <stop offset="100%" stopColor="#120c07" />
        </radialGradient>

        {/* The cast shadow, thrown down-right to match the desk's key light. */}
        <radialGradient id="stamp-cast" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#000000" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0" />
        </radialGradient>

        {/* Wet ink pooled on the rubber's leading edge. */}
        <radialGradient id="stamp-inkpool" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor={ink} stopOpacity="0.42" />
          <stop offset="100%" stopColor={ink} stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* ---- Cast shadow on the desk, offset down-right of the key light ---- */}
      <ellipse cx="112" cy="168" rx="72" ry="17" fill="url(#stamp-cast)" />

      {/* ---- BARREL ------------------------------------------------------
          Drawn first so it sits furthest back. It rises from behind the
          shoulder and is the only part of the object visible in the top cap
          of the circle, which is what makes a foreshortened object read as
          solid rather than as a badge. */}
      <g>
        <path
          d="M -17 60 L -14.5 16 Q -14 7 0 7 Q 14 7 14.5 16 L 17 60 Z"
          transform="translate(100 0)"
          fill="url(#stamp-barrel)"
        />
        {/* specular streak down the left third */}
        <path
          d="M -17 60 L -14.5 16 Q -14 7 0 7 Q 6 7 8 10 L 4 60 Z"
          transform="translate(100 0)"
          fill="url(#stamp-specular)"
        />
        {/* the cap at the top of the handle — the flat you'd press a thumb on */}
        <ellipse cx="100" cy="9" rx="14.5" ry="4.5" fill={metal[2]} opacity="0.9" />
        <ellipse cx="100" cy="8" rx="11" ry="3" fill={metal[0]} opacity="0.55" />

        {/* GRIP RINGS. Without them the barrel is a smooth cone; with them it
            is something a hand grips, which is the whole difference between a
            shape and an object. */}
        <path d="M 86 30 L 114 30" stroke={metal[2]} strokeOpacity="0.45" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M 85.5 40 L 114.5 40" stroke={metal[2]} strokeOpacity="0.45" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M 85 50 L 115 50" stroke={metal[2]} strokeOpacity="0.45" strokeWidth="1.6" strokeLinecap="round" />
      </g>

      {/* ---- SHOULDER ----------------------------------------------------
          The chamfered flare from the barrel out to the face. Only its top
          band is visible, because the face is drawn over it — that crescent
          is what separates "rubber disc" from "stamp". */}
      <g>
        <path
          d="M 83 50 L 27 68 Q 18 71 18 78 L 182 78 Q 182 71 173 68 L 117 50 Z"
          fill="url(#stamp-shoulder)"
        />
        {/* a bright lip along the shoulder's upper edge, catching the light */}
        <path
          d="M 28 68 L 83 51 L 117 51 L 172 68"
          fill="none"
          stroke={metal[0]}
          strokeOpacity="0.6"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>

      {/* ---- FACE --------------------------------------------------------
          Drawn last, in front. This is the rubber, and it is the surface the
          lettering is laid over. Geometry is load-bearing — see the
          "Face Must Stay Inside The Circle" invariant in the file header. */}
      <g>
        <ellipse cx="100" cy="118" rx="92" ry="58" fill="url(#stamp-rubber)" />
        {/* wet ink pooled toward the leading edge, where the rubber meets paper */}
        <ellipse cx="100" cy="132" rx="74" ry="40" fill="url(#stamp-inkpool)" />
        {/* a hard rim so the rubber separates from the shoulder behind it */}
        <ellipse
          cx="100"
          cy="118"
          rx="92"
          ry="58"
          fill="none"
          stroke="#0b0705"
          strokeOpacity="0.6"
          strokeWidth="2.5"
        />
        {/* The inked rim. This is where the stamp's family now lives — a thin
            ring of wet ink around the face, which is also what a real rubber
            stamp leaves on paper. Two pixels of colour do the work that a
            fully-saturated barrel was doing at three hundred. */}
        <ellipse
          cx="100"
          cy="118"
          rx="92"
          ry="58"
          fill="none"
          stroke={ink}
          strokeOpacity="0.85"
          strokeWidth="3"
        />
        {/* a thin bright arc along the top of the rubber — the light that says
            "this surface is turned away from me" */}
        <path
          d="M 8 118 A 92 58 0 0 1 192 118"
          fill="none"
          stroke="#fff6e2"
          strokeOpacity="0.22"
          strokeWidth="2"
        />
      </g>
    </svg>
  );
};
