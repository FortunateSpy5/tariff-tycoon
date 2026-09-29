/**
 * The Customs Desk's location, in one place.
 *
 * WHY THIS EXISTS:
 * The customs location was hard-coded into seven separate strings across the
 * stamp face, the directive sheet, the news marquee, the phase badge, the reset
 * modal and the tutorial chain. That is seven chances to drift, and it was
 * already inconsistent — some sites said "Gate 99B Customs", others "GATE 99B",
 * others "Gate 99B at Liberty International Airport".
 *
 * It was also the repo's weakest legal surface. The gate number is a composite
 * of JFK Tower and JFK Terminal 4 ("the Gate 40s") — a real gate number in a
 * real airport, which is the one Phase 1 string a screenshot could not be
 * distinguished from reportage. The ruling in
 * `.agents/rules/legal-compliance-and-parody.md` §1.5 is that the gate number
 * must never appear without the joke welded to it.
 */

/** Full ceremonial name. Use where there is room to be funny. */
export const CUSTOMS_LOCATION = 'GATE 99B, THE DEEPLY TERMINAL ANNEX';

/**
 * Short form for the 48px phase badge and the marquee, where space is tight.
 *
 * INVARIANT: the gate NUMBER never travels alone. The first draft of this
 * constant was `'GATE 99B'`, which is exactly the string
 * `legal-compliance-and-parody.md` §1.5 rules out — the ruling says "the gate
 * no longer travels on its own", and then a badge shipped reading `GATE 99B`.
 * An abstraction extracted to prevent drift immediately reintroduced the drift
 * it existed to kill. The short form keeps the joke and drops the bare number.
 */
export const CUSTOMS_LOCATION_SHORT = 'THE DEEPLY TERMINAL';

/** The stamp face's two-line break of the same name. */
export const CUSTOMS_STAMP_NAME = 'THE DEEPLY TERMINAL ANNEX';
