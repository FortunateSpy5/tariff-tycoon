/**
 * DecreeCardRenderer — draws a shareable 9:16 "Executive Decree" onto a canvas.
 *
 * VIRALITY RATIONALE:
 * The single most shareable object this game can produce is not a number, it is
 * a DOCUMENT. A screenshot of a wall of UI says "I was playing a game". A fake
 * executive order with a wax seal, a classification banner, a redaction bar and
 * the player's personal portfolio value says "look what I did at 3AM" — which is
 * the actual pitch of the game.
 *
 * So every beat of the game now produces another one of these, and the same
 * renderer draws both the mid-game decree card and the prestige run summary.
 *
 * INVARIANT: rendering is pure canvas work with no network fonts and no external
 * images, so it works offline, costs nothing, and cannot be blocked by CORS.
 * The canvas is never attached to the DOM — it is drawn, read, and discarded.
 */

import type { YapPost } from '../../types/yap';
import type { StockSymbol } from '../../types/market';

/** 1080x1920 — exact 9:16 for TikTok / Reels / Shorts. */
export const CARD_WIDTH = 1080;
export const CARD_HEIGHT = 1920;

export interface DecreeCardData {
  /** Headline printed under the classification banner. */
  readonly title: string;
  /** The decree body — usually the latest YAP text. */
  readonly body: string;
  /** Footer stats, pre-formatted by the caller so the renderer stays pure. */
  readonly stats: ReadonlyArray<{ label: string; value: string }>;
  /** Phase badge, e.g. "PHASE 2 // THE OVAL SYNDICATE". */
  readonly phaseLabel: string;
  /** The ticker that got crashed, if this decree targeted one. */
  readonly targetSymbol?: StockSymbol;
  /** Optional 0-100 banner tint: green for profit, red for suspicion. */
  readonly accent?: 'gold' | 'green' | 'red';
}

/** Wraps text to a pixel width using the canvas context's own metrics. */
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number
): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (ctx.measureText(candidate).width <= maxWidth) {
      current = candidate;
    } else {
      if (current) lines.push(current);
      current = word;
      if (lines.length === maxLines - 1) break;
    }
  }
  if (current && lines.length < maxLines) lines.push(current);

  // Ellipsis the final line if we ran out of room mid-sentence.
  if (lines.length === maxLines) {
    const consumed = lines.join(' ').split(/\s+/).length;
    if (consumed < words.length) {
      lines[maxLines - 1] = `${lines[maxLines - 1].replace(/[,.;:]$/, '')}…`;
    }
  }
  return lines;
}

/**
 * Renders a full 9:16 decree certificate and returns it as a PNG blob.
 * Uses OffscreenCanvas when available, falling back to a detached <canvas>.
 */
export async function renderDecreeCard(data: DecreeCardData): Promise<Blob | null> {
  const canvas = document.createElement('canvas');
  canvas.width = CARD_WIDTH;
  canvas.height = CARD_HEIGHT;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const accent =
    data.accent === 'green'
      ? { bar: '#4ade80', ink: '#052e16' }
      : data.accent === 'red'
        ? { bar: '#ef4444', ink: '#450a0a' }
        : { bar: '#fbbf24', ink: '#451a03' };

  // ---- Aged paper background -------------------------------------------------
  ctx.fillStyle = '#ece4d0';
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

  // Paper grain: deterministic pseudo-random speckle (no Math.random, so the
  // same career always renders an identical card — important for a share).
  let seed = 20260929;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
  ctx.globalAlpha = 0.05;
  for (let i = 0; i < 2600; i += 1) {
    ctx.fillStyle = rand() > 0.5 ? '#5a4628' : '#8a7449';
    ctx.fillRect(rand() * CARD_WIDTH, rand() * CARD_HEIGHT, 2.2, 2.2);
  }
  ctx.globalAlpha = 1;

  // Coffee-ring stain, because of course.
  const stainX = CARD_WIDTH * 0.78;
  const stainY = CARD_HEIGHT * 0.83;
  const stain = ctx.createRadialGradient(stainX, stainY, 40, stainX, stainY, 300);
  stain.addColorStop(0, 'rgba(120, 80, 30, 0.10)');
  stain.addColorStop(0.75, 'rgba(120, 80, 30, 0.06)');
  stain.addColorStop(0.92, 'rgba(120, 80, 30, 0.14)');
  stain.addColorStop(1, 'rgba(120, 80, 30, 0)');
  ctx.fillStyle = stain;
  ctx.beginPath();
  ctx.arc(stainX, stainY, 300, 0, Math.PI * 2);
  ctx.fill();

  const MARGIN = 84;
  const CONTENT_W = CARD_WIDTH - MARGIN * 2;

  // ---- Classification banner -------------------------------------------------
  const bannerY = 150;
  ctx.fillStyle = '#0a0a0a';
  ctx.fillRect(0, bannerY, CARD_WIDTH, 96);
  ctx.fillStyle = '#ece4d0';
  ctx.font = 'bold 40px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('C L A S S I F I E D  //  3 : 0 0  A M', CARD_WIDTH / 2, bannerY + 48);

  // Header rule
  ctx.strokeStyle = 'rgba(60,48,28,0.5)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(MARGIN, bannerY + 150);
  ctx.lineTo(CARD_WIDTH - MARGIN, bannerY + 150);
  ctx.stroke();

  // ---- Office seal (masthead) ------------------------------------------------
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#332c22';
  ctx.font = 'bold 34px "Courier New", monospace';
  ctx.fillText('EXECUTIVE DEGEN', MARGIN, bannerY + 210);
  ctx.fillStyle = '#9f1239';
  ctx.font = 'bold 24px "Courier New", monospace';
  ctx.fillText('SHORT THE WORLD', MARGIN, bannerY + 248);

  // Right-aligned phase stamp
  ctx.textAlign = 'right';
  ctx.fillStyle = '#57534e';
  ctx.font = '20px "Courier New", monospace';
  ctx.fillText(data.phaseLabel, CARD_WIDTH - MARGIN, bannerY + 210);
  ctx.textAlign = 'left';

  // ---- Title -----------------------------------------------------------------
  let y = bannerY + 330;
  ctx.fillStyle = '#211c15';
  ctx.font = 'bold 62px Georgia, "Times New Roman", serif';
  const titleLines = wrapText(ctx, data.title.toUpperCase(), CONTENT_W, 3);
  titleLines.forEach((line) => {
    ctx.fillText(line, MARGIN, y);
    y += 70;
  });

  y += 14;

  // ---- Redaction bar (the classified gag) ------------------------------------
  ctx.fillStyle = '#0f0f0f';
  const barW = CONTENT_W * (0.55 + rand() * 0.3);
  ctx.fillRect(MARGIN, y, barW, 34);
  y += 78;

  // ---- Body text -------------------------------------------------------------
  ctx.fillStyle = '#3a3227';
  ctx.font = '34px Georgia, "Times New Roman", serif';
  const bodyLines = wrapText(ctx, data.body, CONTENT_W, 9);
  bodyLines.forEach((line) => {
    ctx.fillText(line, MARGIN, y);
    y += 50;
  });

  // ---- Stats panel -----------------------------------------------------------
  const statsTop = CARD_HEIGHT - 620;
  ctx.fillStyle = 'rgba(51,44,34,0.07)';
  ctx.fillRect(MARGIN, statsTop, CONTENT_W, 400);
  ctx.strokeStyle = 'rgba(60,48,28,0.45)';
  ctx.lineWidth = 3;
  ctx.strokeRect(MARGIN, statsTop, CONTENT_W, 400);

  ctx.fillStyle = '#57534e';
  ctx.font = 'bold 22px "Courier New", monospace';
  ctx.fillText('P O R T F O L I O   A T   R I S K', MARGIN + 30, statsTop + 48);

  let sy = statsTop + 100;
  data.stats.forEach((stat) => {
    ctx.fillStyle = '#4a4133';
    ctx.font = '26px "Courier New", monospace';
    ctx.fillText(stat.label.toUpperCase(), MARGIN + 30, sy);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#211c15';
    ctx.font = 'bold 40px "Courier New", monospace';
    ctx.fillText(stat.value, CARD_WIDTH - MARGIN - 30, sy + 2);
    ctx.textAlign = 'left';

    sy += 72;
  });

  // ---- Wax seal --------------------------------------------------------------
  const sealX = CARD_WIDTH - MARGIN - 96;
  const sealY = CARD_HEIGHT - 150;
  const sealR = 96;

  // Seal body: dark red with a lighter rim, as a real wax blob looks.
  const sealGrad = ctx.createRadialGradient(sealX - 26, sealY - 30, 10, sealX, sealY, sealR);
  sealGrad.addColorStop(0, '#be123c');
  sealGrad.addColorStop(0.7, '#881337');
  sealGrad.addColorStop(1, '#5c0a24');
  ctx.fillStyle = sealGrad;
  ctx.beginPath();
  // Slightly irregular edge so it reads as poured wax, not a vector circle.
  for (let a = 0; a <= Math.PI * 2 + 0.1; a += 0.14) {
    const wobble = 1 + Math.sin(a * 7) * 0.035 + Math.sin(a * 3.3) * 0.025;
    const px = sealX + Math.cos(a) * sealR * wobble;
    const py = sealY + Math.sin(a) * sealR * wobble;
    if (a === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = 'rgba(0,0,0,0.35)';
  ctx.lineWidth = 4;
  ctx.stroke();

  ctx.fillStyle = 'rgba(255,220,220,0.92)';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 26px "Courier New", monospace';
  ctx.fillText('OFFICIAL', sealX, sealY - 18);
  ctx.fillText('SEAL', sealX, sealY + 12);
  ctx.font = 'bold 18px "Courier New", monospace';
  ctx.fillText('★ TREASURY ★', sealX, sealY + 44);

  // ---- Target ticker chip ----------------------------------------------------
  if (data.targetSymbol) {
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = accent.ink;
    ctx.fillRect(MARGIN, CARD_HEIGHT - 150, 300, 88);
    ctx.fillStyle = accent.bar;
    ctx.font = 'bold 46px "Courier New", monospace';
    ctx.fillText(`$${data.targetSymbol}`, MARGIN + 22, CARD_HEIGHT - 92);
  }

  // ---- Footer strapline ------------------------------------------------------
  ctx.textAlign = 'center';
  ctx.fillStyle = '#57534e';
  ctx.font = '22px "Courier New", monospace';
  ctx.fillText(
    'THE ART OF THE 3:00 AM TARIFF  •  100% TRANSFORMATIVE PARODY',
    CARD_WIDTH / 2,
    CARD_HEIGHT - 40
  );

  return new Promise<Blob | null>((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/png');
  });
}

/** Triggers a browser download for a rendered card. */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Revoke on the next frame so Safari has time to start the download.
  requestAnimationFrame(() => URL.revokeObjectURL(url));
}

/** Builds the mid-game decree card from the player's latest YAP. */
export function decreeDataFromYap(
  yap: YapPost | undefined,
  fallback: {
    treasuryLabel: string;
    phaseLabel: string;
    cronyFavor: number;
    suspicionLabel: string;
  }
): DecreeCardData {
  return {
    title: yap?.targetNation ? `Emergency Tariff: ${yap.targetNation}` : 'Executive Decree',
    body: yap?.rawText ?? 'No decree issued yet. The Dealmaker has been suspiciously quiet.',
    phaseLabel: fallback.phaseLabel,
    accent: 'gold',
    targetSymbol: yap?.targetSymbol,
    stats: [
      { label: 'Treasury', value: fallback.treasuryLabel },
      { label: 'Crony Favor', value: `🤝 ${Math.floor(fallback.cronyFavor)}` },
      { label: 'S.L.O.P. Suspicion', value: fallback.suspicionLabel },
    ],
  };
}
