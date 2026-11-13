import type { ProjectDefinition } from './projects';

/**
 * Image-first printed covers shared by the archive cassettes.
 * The 1600x910 canvas is mapped to a real surface in ProjectPanel.
 * Keep this pure canvas drawing: no additional WebGL passes or network requests.
 */
export const PROJECT_COVER = {
  width: 1600,
  height: 910,
  hero: { x: 34, y: 34, width: 1532, height: 842 },
  dividerY: 712,
} as const;

type Focus = { x: number; y: number; width: number; height: number };
type Palette = { paper: string; ink: string; accent: string; secondary: string; dark: boolean };
const legacyFocus: Record<string, Focus> = {
  '/cases/erste001/assets/opt/assets/mouse/hero-1-1440.avif': { x: 460, y: 140, width: 590, height: 415 },
  '/assets/render/002-cover.avif': { x: 300, y: 300, width: 930, height: 640 },
};
const palettes: Record<string, Palette> = {
  erste001: { paper: '#e3e3dd', ink: '#171d1a', accent: '#5e765d', secondary: '#6e756b', dark: false },
  erste002: { paper: '#1c2228', ink: '#f5f2e9', accent: '#b1c9bf', secondary: '#d0d5d3', dark: true },
};

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

/** Contain without upscaling beyond the target region. Exported for existing callers. */
export function containHero(width: number, height: number) {
  const box = PROJECT_COVER.hero;
  const scale = Math.min(box.width / Math.max(1, width), box.height / Math.max(1, height));
  const w = width * scale, h = height * scale;
  return { x: box.x + (box.width - w) / 2, y: box.y + (box.height - h) / 2, width: w, height: h };
}

function fitCover(sourceWidth: number, sourceHeight: number, bounds: Focus): Focus {
  const scale = Math.max(bounds.width / sourceWidth, bounds.height / sourceHeight);
  const width = sourceWidth * scale;
  const height = sourceHeight * scale;
  return { x: bounds.x + (bounds.width - width) / 2, y: bounds.y + (bounds.height - height) / 2, width, height };
}

function imageSize(source: CanvasImageSource) {
  const img = source as HTMLImageElement | HTMLCanvasElement;
  return {
    width: ('naturalWidth' in img ? img.naturalWidth : img.width) || 1,
    height: ('naturalHeight' in img ? img.naturalHeight : img.height) || 1,
  };
}

function drawImageCrop(c: CanvasRenderingContext2D, image: CanvasImageSource, crop: Focus, target: Focus) {
  const fitted = fitCover(crop.width, crop.height, target);
  c.drawImage(image, crop.x, crop.y, crop.width, crop.height, fitted.x, fitted.y, fitted.width, fitted.height);
}

function line(c: CanvasRenderingContext2D, x: number, y: number, x2: number, y2: number) {
  c.beginPath(); c.moveTo(x, y); c.lineTo(x2, y2); c.stroke();
}

export function drawProjectCover(
  c: CanvasRenderingContext2D,
  project: ProjectDefinition,
  image?: CanvasImageSource,
  collection = 'DESIGN COLLECTION',
) {
  const w = PROJECT_COVER.width, h = PROJECT_COVER.height;
  const palette = palettes[project.id] ?? palettes.erste001;
  const source = image ? imageSize(image) : undefined;
  const crop = source ? (legacyFocus[project.cover ?? ''] ?? { x: 0, y: 0, ...source }) : undefined;

  c.clearRect(0, 0, w, h);
  c.fillStyle = palette.paper;
  c.fillRect(0, 0, w, h);

  if (image && crop) {
    // Atmospheric fill: extend the same authentic project picture across the
    // whole plate. Blurring removes awkward letterbox edges on mixed aspect ratios.
    c.save();
    c.beginPath(); c.rect(22, 22, w - 44, h - 44); c.clip();
    c.globalAlpha = palette.dark ? 0.74 : 0.55;
    c.filter = 'blur(54px) saturate(0.75)';
    drawImageCrop(c, image, crop, { x: -74, y: -74, width: w + 148, height: h + 148 });
    c.filter = 'none';
    c.globalAlpha = 1;
    c.restore();

    // Full-bleed central object, given most of the printable area. Its native
    // aspect ratio is respected rather than stretched to fit a shallow slot.
    const portrait = crop.width / crop.height < 1.25;
    const box = portrait
      ? { x: 235, y: 32, width: 1130, height: 750 }
      : { x: 78, y: 25, width: 1444, height: 755 };
    const scale = Math.min(box.width / crop.width, box.height / crop.height);
    const scaled = { width: crop.width * scale, height: crop.height * scale };
    const x = box.x + (box.width - scaled.width) / 2;
    const y = box.y + (box.height - scaled.height) / 2;
    c.save();
    c.shadowColor = palette.dark ? '#00000044' : '#17231b26';
    c.shadowBlur = 44;
    c.shadowOffsetY = 24;
    c.drawImage(image, crop.x, crop.y, crop.width, crop.height, x, y, scaled.width, scaled.height);
    c.restore();
  } else {
    // Missing images fail gracefully without a broken-image icon or empty white card.
    c.save();
    c.strokeStyle = palette.dark ? '#75807b33' : '#68736738';
    c.lineWidth = 3;
    c.beginPath(); c.ellipse(800, 393, 460, 235, -0.22, 0, Math.PI * 2); c.stroke();
    c.restore();
  }

  // The permanent dark/light bottom scrim makes metadata legible on any render.
  const scrim = c.createLinearGradient(0, 510, 0, h);
  if (palette.dark) {
    scrim.addColorStop(0, 'rgba(14,19,24,0)');
    scrim.addColorStop(0.35, 'rgba(14,19,24,.68)');
    scrim.addColorStop(0.72, 'rgba(14,19,24,.96)');
    scrim.addColorStop(1, 'rgba(14,19,24,.99)');
  } else {
    scrim.addColorStop(0, 'rgba(229,230,223,0)');
    scrim.addColorStop(0.35, 'rgba(229,230,223,.72)');
    scrim.addColorStop(0.72, 'rgba(229,230,223,.97)');
    scrim.addColorStop(1, 'rgba(229,230,223,1)');
  }
  c.fillStyle = scrim; c.fillRect(22, 510, w - 44, 378);

  // Physical label edges are almost invisible from a distance. Keep the case,
  // material, reflections and project photography as the primary impression.
  c.strokeStyle = palette.dark ? 'rgba(241,244,235,.17)' : 'rgba(24,36,24,.22)';
  c.lineWidth = 2;
  c.strokeRect(22, 22, w - 44, h - 44);

  const topShade = c.createLinearGradient(0, 24, 0, 210);
  topShade.addColorStop(0, palette.dark ? 'rgba(9,15,21,.62)' : 'rgba(230,230,222,.67)');
  topShade.addColorStop(1, 'rgba(0,0,0,0)');
  c.fillStyle = topShade;
  c.fillRect(24, 24, w - 48, 190);

  // Small editorial header. The hero—not the headline—must catch attention.
  c.textBaseline = 'alphabetic';
  c.fillStyle = palette.ink;
  c.globalAlpha = .83;
  c.font = '600 22px MiSans,Arial,sans-serif';
  c.fillText('ERSTE  /  DESIGN ARCHIVE', 74, 92);
  c.textAlign = 'right';
  c.font = '500 21px Consolas,monospace';
  c.fillText('FILE ' + project.number, 1525, 92);
  c.textAlign = 'left';
  c.globalAlpha = 1;

  // A single strong title and a narrow strip of secondary information.
  c.fillStyle = palette.ink;
  c.font = '750 102px MiSans,Arial,sans-serif';
  c.fillText(project.title, 72, 780, 1210);

  c.strokeStyle = palette.accent;
  c.globalAlpha = .6;
  line(c, 74, 810, 1525, 810);
  c.globalAlpha = 1;

  c.fillStyle = palette.secondary;
  c.font = '500 23px MiSans,Arial,sans-serif';
  const subtitle = project.subtitle ?? 'INDEPENDENT PRODUCT DESIGN';
  c.fillText(subtitle, 75, 852, 1040);
  c.textAlign = 'right';
  c.font = '500 20px Consolas,monospace';
  c.fillText(project.status ?? collection, 1525, 852, 390);
  c.textAlign = 'left';

  // Tiny volume marker distinguishes the two covers without repeating the
  // original technical ticks and ornamental figure labels.
  const markerWidth = clamp(26, 20, 32);
  c.fillStyle = palette.accent;
  c.fillRect(1525 - markerWidth, 735, markerWidth, 6);
}
