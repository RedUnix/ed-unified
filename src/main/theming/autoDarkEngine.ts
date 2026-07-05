import type { AutoDarkSettings } from '@shared/types'

/**
 * Practical approximation of Dark Reader, not a reimplementation: composes
 * `invert(1) hue-rotate(180deg)` (which keeps hues roughly intact instead of a
 * plain photo-negative invert) with brightness/contrast/sepia adjustments, and
 * counter-inverts media elements so images/video don't look inverted. Skips the
 * invert step entirely if the page's own background is already dark. Full
 * per-rule CSSOM color remapping (Dark Reader's real approach) is out of scope.
 *
 * Returned as a JS string run via `webContents.executeJavaScript(...)` (not just
 * `insertCSS`) because the already-dark check needs `getComputedStyle` from
 * within the page context. Idempotent: safe to re-run after in-tab navigation.
 */
export function buildAutoDarkScript(settings: AutoDarkSettings): string {
  const settingsJson = JSON.stringify(settings)
  return `(() => {
    const settings = ${settingsJson};
    const STYLE_ID = 'ed-autodark-style';
    const MARKER_ATTR = 'data-ed-autodark';

    const existingStyle = document.getElementById(STYLE_ID);
    if (existingStyle) existingStyle.remove();

    if (!settings.enabled) {
      document.documentElement.style.filter = '';
      document.documentElement.removeAttribute(MARKER_ATTR);
      return;
    }

    function parseRgb(value) {
      const match = /rgba?\\(([^)]+)\\)/.exec(value || '');
      if (!match) return null;
      const parts = match[1].split(',').map((s) => parseFloat(s.trim()));
      if (parts.length < 3 || parts.some((n) => Number.isNaN(n))) return null;
      return { r: parts[0], g: parts[1], b: parts[2] };
    }

    let shouldInvert = true;
    try {
      const rgb = parseRgb(getComputedStyle(document.body).backgroundColor);
      if (rgb) {
        const luminance = 0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b;
        if (luminance < 60) shouldInvert = false;
      }
    } catch (e) {
      // Cross-origin or detached body; fall back to inverting.
    }

    const filters = [];
    if (shouldInvert) filters.push('invert(1) hue-rotate(180deg)');
    if (settings.brightness !== 1) filters.push('brightness(' + settings.brightness + ')');
    if (settings.contrast !== 1) filters.push('contrast(' + settings.contrast + ')');
    if (settings.sepia !== 0) filters.push('sepia(' + settings.sepia + ')');

    document.documentElement.style.filter = filters.join(' ');
    document.documentElement.setAttribute(MARKER_ATTR, shouldInvert ? 'inverted' : 'adjusted');

    if (shouldInvert) {
      const style = document.createElement('style');
      style.id = STYLE_ID;
      style.textContent = 'img, video, picture, canvas, svg { filter: invert(1) hue-rotate(180deg) !important; }';
      document.head.appendChild(style);
    }
  })();`
}
