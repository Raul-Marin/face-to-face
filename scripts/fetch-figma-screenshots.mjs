#!/usr/bin/env node
/**
 * Genera screenshots PNG de cada componente desde Figma.
 * Requiere: FIGMA_ACCESS_TOKEN (https://www.figma.com/developers/api#access-tokens)
 *
 * Uso: FIGMA_ACCESS_TOKEN=xxx node scripts/fetch-figma-screenshots.mjs
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

const LINKS = {
  ios: {
    figmaFileKey: "p3GFDTpfionGpgJqxF6JWg",
    figmaNodeIds: {
      "action-sheets": "507-24669",
      alerts: "507-24668",
      buttons: "507-24673",
      "contextual-menus": "507-25994",
      lists: "507-24675",
      menus: "507-24676",
      "page-controls": "507-24679",
      pickers: "507-24680",
      popovers: "507-24681",
      "popup-buttons": "507-26009",
      progress: "507-24682",
      segmented: "507-24683",
      sheets: "507-24684",
      sidebars: "507-26013",
      sliders: "507-24685",
      steppers: "507-24687",
      "tab-bars": "507-24689",
      "text-fields": "553-22762",
      toggles: "507-24690",
      toolbars: "507-25993",
    },
  },
  md: {
    figmaFileKey: "ffMWiW3PmeskrsShXvhLrb",
    figmaNodeIds: {
      "app-bars": "55141-14169",
      badges: "55141-14167",
      "bottom-sheets": "55141-14170",
      buttons: "55141-14168",
      cards: "55141-14171",
      carousel: "55141-14172",
      checkboxes: "55141-14173",
      chips: "55141-14174",
      "date-picker": "55141-14175",
      dialogs: "55141-14176",
      dividers: "55141-14177",
      fab: "55141-14168",
      "icon-buttons": "55141-14168",
      lists: "55141-14249",
      loading: "55141-14252",
      menus: "55141-14250",
      "nav-bars": "55141-14251",
      "nav-drawer": "55141-14251",
      "nav-rail": "55141-14251",
      progress: "55141-14252",
      radio: "55141-14253",
      search: "55141-14254",
      segmented: "55141-14168",
      "side-sheets": "55141-14170",
      sliders: "55141-14255",
      snackbars: "55141-14256",
      switch: "55141-14257",
      tabs: "55141-14258",
      "text-fields": "55141-14259",
      toolbar: "58295-22726",
      tooltips: "55141-14261",
    },
  },
};

const token = process.env.FIGMA_ACCESS_TOKEN;
if (!token) {
  console.error("Necesitas FIGMA_ACCESS_TOKEN. Obtén uno en https://www.figma.com/developers/api#access-tokens");
  process.exit(1);
}

const dirs = {
  ios: path.join(ROOT, "screenshots", "ios"),
  md: path.join(ROOT, "screenshots", "md"),
};
fs.mkdirSync(dirs.ios, { recursive: true });
fs.mkdirSync(dirs.md, { recursive: true });

function nodeIdToFigma(nodeId) {
  return nodeId.replace("-", ":");
}

async function fetchFigmaImages(fileKey, nodeIds) {
  const ids = Object.values(nodeIds).map(nodeIdToFigma).join(",");
  const url = `https://api.figma.com/v1/images/${fileKey}?ids=${ids}&format=png&scale=2`;
  const res = await fetch(url, {
    headers: { "X-Figma-Token": token },
  });
  if (!res.ok) throw new Error(`Figma API: ${res.status} ${res.statusText}`);
  const data = await res.json();
  return data.images || {};
}

async function downloadImage(url, filepath) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(filepath, buf);
}

async function main() {
  for (const [side, cfg] of Object.entries(LINKS)) {
    const { figmaFileKey, figmaNodeIds } = cfg;
    const slugToNodeId = {};
    for (const [slug, nodeId] of Object.entries(figmaNodeIds)) {
      slugToNodeId[slug] = nodeIdToFigma(nodeId);
    }

    console.log(`\n[${side.toUpperCase()}] Fetching ${Object.keys(figmaNodeIds).length} images...`);
    const images = await fetchFigmaImages(figmaFileKey, figmaNodeIds);

    for (const [slug, nodeId] of Object.entries(figmaNodeIds)) {
      const figmaId = nodeIdToFigma(nodeId);
      const imageUrl = images[figmaId];
      if (!imageUrl) {
        console.warn(`  ⚠ ${slug}: no image URL`);
        continue;
      }
      const filepath = path.join(dirs[side], `${slug}.png`);
      await downloadImage(imageUrl, filepath);
      console.log(`  ✓ ${slug}.png`);
    }
  }
  console.log("\nHecho. Screenshots en screenshots/ios/ y screenshots/md/");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
