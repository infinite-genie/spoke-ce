type Rgb = readonly [number, number, number];

function parseHex(hex: string): Rgb {
  const h = hex.replace('#', '');
  const full =
    h.length === 3
      ? h
          .split('')
          .map((c) => c + c)
          .join('')
      : h;
  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ];
}

/** Parses #rgb/#rrggbb or rgba(r,g,b,a); rgba is alpha-composited over `backdrop`. */
function parseColor(input: string, backdrop: Rgb): Rgb {
  const rgba = input.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)$/);
  if (rgba) {
    const [, r, g, b, a] = rgba;
    const alpha = a === undefined ? 1 : Number(a);
    return [Number(r), Number(g), Number(b)].map(
      (c, i) => c * alpha + backdrop[i]! * (1 - alpha),
    ) as unknown as Rgb;
  }
  if (input.startsWith('#')) return parseHex(input);
  throw new Error(`Unsupported color format: ${input}`);
}

function luminance([r, g, b]: Rgb): number {
  const lin = (c: number) => {
    const v = c / 255;
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/** WCAG 2.x contrast ratio. `bg` must be opaque; rgba `fg` is composited over it. */
export function contrastRatio(fg: string, bg: string): number {
  const bgRgb = parseColor(bg, [255, 255, 255]);
  const fgRgb = parseColor(fg, bgRgb);
  const l1 = luminance(fgRgb);
  const l2 = luminance(bgRgb);
  const [hi, lo] = l1 >= l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}
