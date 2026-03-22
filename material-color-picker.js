/**
 * Core colors panel - Material Theme Builder style.
 * Override key colors to generate tonal palettes and schemes.
 */
const STORAGE_KEY = "face2face-material-custom-theme";

const CORE_COLORS = [
  { id: "primary", label: "Primary", desc: "Actúa como color fuente del tema." },
  { id: "secondary", label: "Secondary", desc: "Roles secundarios menos prominentes." },
  { id: "tertiary", label: "Tertiary", desc: "Acentos de contraste." },
  { id: "error", label: "Error", desc: "Estados de error." },
  { id: "neutral", label: "Neutral", desc: "Fondos y superficies." },
  { id: "neutralVariant", label: "Neutral Variant", desc: "Énfasis medio y variantes." },
];

const DEFAULT_CORE_COLORS = {
  primary: "#6750A4",
  secondary: "#625B71",
  tertiary: "#7D5260",
  error: "#B3261E",
  neutral: "#79747E",
  neutralVariant: "#7A757F",
};

async function loadColorUtils() {
  const m = await import("https://esm.sh/@material/material-color-utilities@0.4.0");
  return m;
}

  function getM3TokenKeys() {
    return [
      "primary", "on-primary", "primary-container", "on-primary-container",
      "secondary", "on-secondary", "secondary-container", "on-secondary-container",
      "tertiary", "on-tertiary", "tertiary-container", "on-tertiary-container",
      "error", "on-error", "error-container", "on-error-container",
      "surface", "on-surface", "surface-variant", "on-surface-variant",
      "outline", "outline-variant", "surface-container", "surface-container-low",
      "surface-container-high", "surface-container-highest",
      "primary-rgb", "primary-container-rgb", "secondary-rgb", "tertiary-rgb", "error-rgb"
    ];
  }

  function clearCustomTheme() {
    const keys = getM3TokenKeys();
    keys.forEach((k) => document.body.style.removeProperty(`--md-sys-color-${k}`));
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (_) {}
  }

  function argbToRgb(argb) {
    const r = (argb >> 16) & 0xff;
    const g = (argb >> 8) & 0xff;
    const b = argb & 0xff;
    return `${r}, ${g}, ${b}`;
  }

  function tonesFromHex(hex, utils) {
    const argb = utils.argbFromHex(hex.startsWith("#") ? hex : `#${hex}`);
    const hct = utils.Hct.fromInt(argb);
    const palette = utils.CorePalette.of(argb).a1;
    const onTone = hct.tone < 50 ? 100 : 10;
    return {
      main: utils.hexFromArgb(argb),
      on: utils.hexFromArgb(palette.tone(onTone)),
      container: utils.hexFromArgb(palette.tone(90)),
      onContainer: utils.hexFromArgb(palette.tone(10)),
      argb,
    };
  }

  function applySchemeToBody(theme, utils, overrides = {}) {
    utils.applyTheme(theme, { target: document.body, dark: false });
    const scheme = theme.schemes?.light || theme;
    const json = scheme?.toJSON ? scheme.toJSON() : scheme || {};
    if (json.primary != null) {
      document.body.style.setProperty("--md-sys-color-primary-rgb", argbToRgb(json.primary));
    }
    if (json.primaryContainer != null) {
      document.body.style.setProperty("--md-sys-color-primary-container-rgb", argbToRgb(json.primaryContainer));
    }
    for (const [role, hex] of Object.entries(overrides)) {
      if (!hex) continue;
      const tones = tonesFromHex(hex, utils);
      if (role === "neutral") {
        const pal = utils.CorePalette.of(tones.argb).n1;
        document.body.style.setProperty("--md-sys-color-surface", utils.hexFromArgb(pal.tone(98)));
        document.body.style.setProperty("--md-sys-color-on-surface", utils.hexFromArgb(pal.tone(10)));
        document.body.style.setProperty("--md-sys-color-outline", utils.hexFromArgb(pal.tone(50)));
        document.body.style.setProperty("--md-sys-color-outline-variant", utils.hexFromArgb(pal.tone(80)));
        document.body.style.setProperty("--md-sys-color-surface-container", utils.hexFromArgb(pal.tone(94)));
        document.body.style.setProperty("--md-sys-color-surface-container-low", utils.hexFromArgb(pal.tone(96)));
        document.body.style.setProperty("--md-sys-color-surface-container-high", utils.hexFromArgb(pal.tone(92)));
        document.body.style.setProperty("--md-sys-color-surface-container-highest", utils.hexFromArgb(pal.tone(90)));
      } else if (role === "neutralVariant") {
        const pal = utils.CorePalette.of(tones.argb).n2;
        document.body.style.setProperty("--md-sys-color-surface-variant", utils.hexFromArgb(pal.tone(90)));
        document.body.style.setProperty("--md-sys-color-on-surface-variant", utils.hexFromArgb(pal.tone(30)));
        document.body.style.setProperty("--md-sys-color-outline-variant", utils.hexFromArgb(pal.tone(80)));
      } else {
        document.body.style.setProperty(`--md-sys-color-${role}`, tones.main);
        document.body.style.setProperty(`--md-sys-color-on-${role}`, tones.on);
        document.body.style.setProperty(`--md-sys-color-${role}-container`, tones.container);
        document.body.style.setProperty(`--md-sys-color-on-${role}-container`, tones.onContainer);
        if (role === "secondary") document.body.style.setProperty("--md-sys-color-secondary-rgb", argbToRgb(tones.argb));
        if (role === "tertiary") document.body.style.setProperty("--md-sys-color-tertiary-rgb", argbToRgb(tones.argb));
        if (role === "error") document.body.style.setProperty("--md-sys-color-error-rgb", argbToRgb(tones.argb));
      }
    }
    try {
      const stored = {};
      CORE_COLORS.forEach((c) => {
        const input = document.getElementById(`color-${c.id}`);
        if (input?.value) stored[c.id] = input.value;
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
    } catch (_) {}
  }

  /**
   * Paleta completa: primary + secondary/tertiary en otros matices, error rojizo,
   * neutros con baja saturación ligados al matiz del primary (superficies coherentes).
   */
  function randomFullPalette() {
    const hPrimary = Math.random() * 360;
    const primary = hslToHex(hPrimary, 46 + Math.random() * 34, 34 + Math.random() * 22);

    const spread = 38 + Math.random() * 52;
    const hSecondary = (hPrimary + spread + (Math.random() - 0.5) * 22 + 360) % 360;
    const secondary = hslToHex(hSecondary, 30 + Math.random() * 30, 32 + Math.random() * 20);

    let hTertiary = (hPrimary + 108 + Math.random() * 75) % 360;
    if (Math.abs(hTertiary - hSecondary) < 28 || Math.abs(hTertiary - hPrimary) < 22) {
      hTertiary = (hTertiary + 48) % 360;
    }
    const tertiary = hslToHex(hTertiary, 36 + Math.random() * 34, 36 + Math.random() * 18);

    const errorHue = Math.random() < 0.5 ? Math.random() * 16 : 344 + Math.random() * 16;
    const error = hslToHex(errorHue % 360, 60 + Math.random() * 24, 38 + Math.random() * 14);

    const neutral = hslToHex(
      (hPrimary + (Math.random() - 0.5) * 26 + 360) % 360,
      4 + Math.random() * 9,
      46 + Math.random() * 9
    );
    const neutralVariant = hslToHex(
      (hPrimary + 18 + (Math.random() - 0.5) * 24 + 360) % 360,
      6 + Math.random() * 11,
      44 + Math.random() * 11
    );

    return {
      primary,
      secondary,
      tertiary,
      error,
      neutral,
      neutralVariant,
    };
  }

  function hslToHex(h, s, l) {
    s /= 100;
    l /= 100;
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = l - c / 2;
    let r = 0, g = 0, b = 0;
    if (h < 60) {
      r = c; g = x; b = 0;
    } else if (h < 120) {
      r = x; g = c; b = 0;
    } else if (h < 180) {
      r = 0; g = c; b = x;
    } else if (h < 240) {
      r = 0; g = x; b = c;
    } else if (h < 300) {
      r = x; g = 0; b = c;
    } else {
      r = c; g = 0; b = x;
    }
    const toHex = (n) => Math.round((n + m) * 255).toString(16).padStart(2, "0");
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }

  function createPanel() {
    const existing = document.getElementById("material-color-panel");
    if (existing) return existing;

    const panel = document.createElement("div");
    panel.id = "material-color-panel";
    panel.className = "material-color-panel";
    panel.setAttribute("role", "region");
    panel.setAttribute("aria-label", "Core colors");

    const colorRows = CORE_COLORS.map(
      (c) => `
      <div class="material-color-row" data-role="${c.id}">
        <label class="material-color-swatch-wrap">
          <span class="material-color-swatch" id="swatch-${c.id}"></span>
          <input type="color" class="material-color-input" id="color-${c.id}" value="${DEFAULT_CORE_COLORS[c.id]}" data-role="${c.id}" />
        </label>
        <div class="material-color-row-text">
          <span class="material-color-row-label">${c.label}</span>
          <span class="material-color-row-desc">${c.desc}</span>
        </div>
      </div>
    `
    ).join("");

    panel.innerHTML = `
      <div class="material-color-panel-inner">
        <div class="material-color-panel-header">
          <h2 class="material-color-panel-title">Core colors</h2>
          <button type="button" class="material-color-panel-close" aria-label="Cerrar">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
        <p class="material-color-panel-desc">Ajusta cada rol o usa <strong>Aleatorio</strong> para renovar toda la paleta (primary, acentos, error y superficies).</p>

        <div class="material-color-list">${colorRows}</div>

        <div class="material-color-actions">
          <button type="button" class="material-color-btn material-color-btn-shuffle" id="material-color-shuffle" title="Paleta aleatoria completa">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/></svg>
            Aleatorio
          </button>
          <button type="button" class="material-color-btn material-color-btn-reset" id="material-color-reset">Restaurar</button>
        </div>
      </div>
    `;

    document.body.appendChild(panel);
    return panel;
  }

  function openPanel() {
    const panel = createPanel();
    panel.classList.add("open");
  }

  function closePanel() {
    const panel = document.getElementById("material-color-panel");
    if (panel) panel.classList.remove("open");
  }

  function init(setApplyFn) {
    const panel = createPanel();

    panel.querySelector(".material-color-panel-close").addEventListener("click", closePanel);

    const shuffleBtn = document.getElementById("material-color-shuffle");
    const resetBtn = document.getElementById("material-color-reset");

    function collectOverrides() {
      const o = {};
      CORE_COLORS.forEach((c) => {
        const input = document.getElementById(`color-${c.id}`);
        if (input?.value) o[c.id] = input.value;
      });
      return o;
    }

    async function applyAndSync(overrides = null) {
      const o = overrides ?? collectOverrides();
      const primaryHex = o.primary || DEFAULT_CORE_COLORS.primary;
      try {
        const utils = await loadColorUtils();
        const theme = utils.themeFromSourceColor(utils.argbFromHex(primaryHex.startsWith("#") ? primaryHex : `#${primaryHex}`));
        const toApply = {};
        CORE_COLORS.forEach((c) => {
          if (o[c.id] && c.id !== "primary") toApply[c.id] = o[c.id];
        });
        applySchemeToBody(theme, utils, toApply);
        const json = theme.schemes.light.toJSON ? theme.schemes.light.toJSON() : theme.schemes.light;
        CORE_COLORS.forEach((c) => {
          const input = document.getElementById(`color-${c.id}`);
          const swatch = document.getElementById(`swatch-${c.id}`);
          const key = c.id === "neutralVariant" ? "neutralVariant" : c.id;
          const hex = o[c.id] || (json[key] != null ? utils.hexFromArgb(json[key]) : null);
          if (hex && input && swatch) {
            input.value = hex;
            swatch.style.background = hex;
          }
        });
      } catch (err) {
        console.error("Error applying theme:", err);
      }
    }

    CORE_COLORS.forEach((c) => {
      const input = document.getElementById(`color-${c.id}`);
      const swatch = document.getElementById(`swatch-${c.id}`);
      if (!input || !swatch) return;
      swatch.style.background = input.value;
      input.addEventListener("input", (e) => {
        const hex = e.target.value;
        swatch.style.background = hex;
        applyAndSync();
      });
    });

    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      const hasSaved = Object.keys(saved).length > 0;
      if (hasSaved) {
        CORE_COLORS.forEach((c) => {
          const v = saved[c.id];
          if (v) {
            const input = document.getElementById(`color-${c.id}`);
            const swatch = document.getElementById(`swatch-${c.id}`);
            if (input && swatch) {
              input.value = v;
              swatch.style.background = v;
            }
          }
        });
      }
    } catch (_) {}
    if (typeof setApplyFn === "function") setApplyFn(() => applyAndSync());
    applyAndSync();

    shuffleBtn.addEventListener("click", () => {
      const colors = randomFullPalette();
      CORE_COLORS.forEach((c) => {
        const hex = colors[c.id];
        const input = document.getElementById(`color-${c.id}`);
        const sw = document.getElementById(`swatch-${c.id}`);
        if (input && sw && hex) {
          input.value = hex;
          sw.style.background = hex;
        }
      });
      applyAndSync(colors);
    });

    resetBtn.addEventListener("click", () => {
      clearCustomTheme();
      CORE_COLORS.forEach((c) => {
        const v = DEFAULT_CORE_COLORS[c.id];
        const input = document.getElementById(`color-${c.id}`);
        const sw = document.getElementById(`swatch-${c.id}`);
        if (input && sw) {
          input.value = v;
          sw.style.background = v;
        }
      });
      applyAndSync();
    });
  }

  let applyFn = () => {};
  init((fn) => { applyFn = fn; });

  const observer = new MutationObserver((mutations) => {
    for (const m of mutations) {
      if (m.type === "attributes" && m.attributeName === "data-theme" && document.body.getAttribute("data-theme") === "material") {
        applyFn();
        break;
      }
    }
  });
  observer.observe(document.body, { attributes: true });

  window.__MATERIAL_COLOR_PICKER__ = { open: openPanel, close: closePanel, clear: clearCustomTheme };
