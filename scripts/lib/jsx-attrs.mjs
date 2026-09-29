/**
 * A minimal JSX opening-tag reader: enough to list an element's attributes and
 * their exact source values, and nothing else.
 *
 * WHY THIS EXISTS, INSTEAD OF REGEXES OVER THE TAG SOURCE
 *
 * A gate that asks "does this element carry a hint?" cannot be answered by
 * substring-matching the tag's text, because in JSX a tag's source contains two
 * different things that look identical:
 *
 *   <button onClick={f} {...hint('costs $5')}>   <- a hint, ON this element
 *   <button onClick={() => f({ ...hint('x') })}>  <- a hint, NESTED in a handler
 *   <button onClick={f} className="chip data-hint='b'">  <- no hint; a string
 *   <button onClick={f} aria-label="read data-hint='b'"> <- no hint; a string
 *
 * Only the first is an attribute of the element. Every attempt to separate them
 * with a regex failed, each in a way that is worth recording because the failure
 * is not obvious:
 *
 *   1. Match `data-hint=` anywhere  ->  cases 3 and 4 pass. A bare substring
 *      match is defeated by the marker appearing inside ANY string.
 *   2. Match against the span with every `{...}` blanked  ->  case 1 fails,
 *      because a spread attribute IS a `{...}` and blanking erases `hint`. 44
 *      false positives across the real tree.
 *   3. Match against the span with every string blanked  ->  case 1 fails again,
 *      because the hint's own text argument is a string, and it is precisely the
 *      evidence being looked for. 12 false positives.
 *
 * Blanking cannot work here in either direction: the evidence and the smuggled
 * marker are BOTH strings, so any rule that hides one hides the other.
 *
 * So the answer is structural rather than textual. Parsing attributes gives the
 * one thing a regex cannot: the difference between a value at attribute
 * position and the same characters nested inside something else. Cases 1 and 2
 * are then decided by `attr.name`, with no judgement about strings at all.
 */

/** Read a quoted string starting at the quote. Returns the index after it. */
function readQuoted(src, i) {
  const quote = src[i];
  i += 1;
  while (i < src.length) {
    if (src[i] === '\\') i += 1;
    else if (src[i] === quote) return i + 1;
    i += 1;
  }
  return i;
}

/**
 * Read a `{...}` expression starting at the brace, honouring nesting and quotes.
 *
 * Braces alone are not enough: `onClick={() => f()}` contains a `>` that does
 * not end the tag, which is the reason a regex cannot scan a tag at all.
 */
function readBraced(src, i) {
  let depth = 0;
  while (i < src.length) {
    const c = src[i];
    if (c === '"' || c === "'" || c === '`') i = readQuoted(src, i);
    else if (c === '{') {
      depth += 1;
      i += 1;
    } else if (c === '}') {
      depth -= 1;
      i += 1;
      if (depth === 0) return i;
    } else i += 1;
  }
  return i;
}

const isSpace = (c) => c === ' ' || c === '\t' || c === '\n' || c === '\r';

/**
 * Parse the opening tag beginning at `start` (the `<`).
 *
 * INVARIANT: [Attribute Position Is Structural, Not Textual]
 * A name is read only where an attribute may legally begin: at the top level of
 * the tag, between attributes, and never inside a value. A bare attribute needs
 * no sentinel space before it, because termination is decided by reaching `>` or
 * `/>` rather than by looking ahead for a delimiter — which is what previously
 * made `<div contentEditable>x</div>` (a trailing bare attribute, no space after
 * it) read as inert while `<div contentEditable />` was caught.
 *
 * @returns `null` if no tag closes, else `{ tag, attrs, end }`. `end` is the
 *          index just past `>`. `attrs` is `[{ name, value }]` where `value` is
 *          the raw source of the value including its quotes or braces, or
 *          `null` for a valueless attribute. A spread attribute is reported with
 *          its full `{...expr}` as both name and value, since that is how it is
 *          written.
 */
export function parseOpeningTag(src, start) {
  if (src[start] !== '<') return null;
  const nameMatch = /^[A-Za-z][A-Za-z0-9.:-]*/.exec(src.slice(start + 1));
  if (!nameMatch) return null;
  const attrs = [];
  let i = start + 1 + nameMatch[0].length;

  for (;;) {
    while (i < src.length && isSpace(src[i])) i += 1;
    const c = src[i];
    if (c === undefined || c === '>' || c === '/') break;

    // A spread attribute. Its whole source is the name, so `{...hint('x')}` is
    // reported as itself and a caller can test for a hint without inspecting
    // strings.
    if (c === '{') {
      const end = readBraced(src, i);
      const raw = src.slice(i, end);
      attrs.push({ name: raw, value: raw, spread: true });
      i = end;
      continue;
    }

    const attrMatch = /^[A-Za-z_][A-Za-z0-9:.-]*/.exec(src.slice(i));
    if (!attrMatch) {
      // Not a name and not a spread: skip a character so a malformed tag cannot
      // spin here forever.
      i += 1;
      continue;
    }
    const name = attrMatch[0];
    i += name.length;
    while (i < src.length && isSpace(src[i])) i += 1;

    if (src[i] !== '=') {
      attrs.push({ name, value: null, spread: false });
      continue;
    }
    i += 1;
    while (i < src.length && isSpace(src[i])) i += 1;

    let value;
    if (src[i] === '{') {
      const end = readBraced(src, i);
      value = src.slice(i, end);
      i = end;
    } else if (src[i] === '"' || src[i] === "'" || src[i] === '`') {
      const end = readQuoted(src, i);
      value = src.slice(i, end);
      i = end;
    } else {
      const start2 = i;
      while (i < src.length && !isSpace(src[i]) && src[i] !== '>' && src[i] !== '/') i += 1;
      value = src.slice(start2, i);
    }
    attrs.push({ name, value, spread: false });
  }

  return { tag: src.slice(start, i + 1), attrs, end: i + 1 };
}
