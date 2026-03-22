(function () {
  const data = window.__GRAPH__;
  const links = window.__LINKS__ || { ios: {}, md: {} };
  const descriptions = window.__COMPONENT_DESCRIPTIONS__ || {};
  const icons = window.__ICONS__ || {};
  const references = window.__REFERENCES__ || {};

  if (!data) {
    document.body.innerHTML =
      "<p class='p-4 text-red-600'>No se cargó graph-data.js. Abre por http://localhost:8765/</p>";
    return;
  }

  const nodeById = new Map(data.nodes.map((n) => [n.id, n]));
  const connected = new Set();
  data.edges.forEach((e) => {
    connected.add(e.from);
    connected.add(e.to);
  });

  const pairs = data.edges
    .filter((e) => e.from.startsWith("ios-") && e.to.startsWith("md-"))
    .map((e) => ({
      ios: nodeById.get(e.from),
      md: nodeById.get(e.to),
      level: e.level || "baja",
      note: e.note || "",
    }))
    .filter((p) => p.ios && p.md);

  const orphansIos = data.nodes.filter(
    (n) => n.side === "ios" && !connected.has(n.id)
  );
  const orphansMd = data.nodes.filter(
    (n) => n.side === "android" && !connected.has(n.id)
  );

  function slugify(s) {
    return String(s)
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
  }

  function escapeHtml(s) {
    const el = document.createElement("span");
    el.textContent = String(s);
    return el.innerHTML;
  }

  function getLinks(id) {
    const side = id.startsWith("ios-") ? "ios" : "md";
    const cfg = links[side] || {};
    const slugKey = id.replace(/^(ios|md)-/, "");
    const slug = cfg.slugs?.[slugKey] || slugKey;
    const docBase = cfg.docBase || "#";
    const sdkBase = cfg.sdkBase || "#";
    const figmaBase = cfg.figmaBase;
    const figmaFileKey = cfg.figmaFileKey;
    const nodeId = cfg.figmaNodeIds?.[slugKey];

    let doc = docBase;
    if (side === "ios" && cfg.docPaths?.[slugKey]) {
      doc = `${docBase}/${cfg.docPaths[slugKey]}`;
    } else if (side === "md") {
      const docPath = cfg.docPaths?.[slugKey];
      doc = docPath && docPath.startsWith("http") ? docPath : `${docBase}/${docPath || slug}`;
    }

    let sdk = sdkBase;
    const sdkPath = cfg.sdkPaths?.[slugKey];
    if (sdkPath) {
      if (sdkPath.startsWith("http")) {
        sdk = sdkPath;
      } else {
        sdk = side === "ios"
          ? `${sdkBase}/${sdkPath}`
          : `${sdkBase}${sdkPath.startsWith("/") ? "" : "/"}${sdkPath}`;
      }
    } else if (side === "md" && cfg.sdkDefaultPath) {
      sdk = `${sdkBase}${cfg.sdkDefaultPath}`;
    }

    let figma = null;
    let figmaEmbed = null;
    if (figmaBase && nodeId) {
      const designUrl = `${figmaBase}${figmaBase.includes("?") ? "&" : "?"}node-id=${nodeId.replace(":", "-")}`;
      figma = designUrl;
      figmaEmbed = `https://www.figma.com/embed?embed_host=share&url=${encodeURIComponent(designUrl)}`;
    }

    return { doc, sdk, figma, figmaEmbed };
  }

  function linkEl(href, label, linkClass = "") {
    if (!href || href === "#") return "";
    const cls = linkClass ? ` class="${escapeHtml(linkClass)}"` : "";
    return `<a href="${escapeHtml(href)}" target="_blank" rel="noopener"${cls}>${escapeHtml(label)}</a>`;
  }

  function cardBtn(href, label, iconKey) {
    if (!href || href === "#") return "";
    const icon = icons[iconKey] || "";
    return `<a href="${escapeHtml(href)}" target="_blank" rel="noopener" class="comp-card-btn"><span class="comp-card-btn-icon">${icon}</span>${escapeHtml(label)}</a>`;
  }

  function getExtendedDescription(pair) {
    const iosKey = pair.ios.id.replace(/^ios-/, "");
    const mdKey = pair.md.id.replace(/^md-/, "");
    const entry = descriptions[iosKey] || descriptions[mdKey];
    const descIos = entry?.ios;
    const descMd = entry?.md || (typeof entry === "string" ? entry : null);
    const parts = [];
    if (descIos) parts.push(descIos);
    if (descMd) parts.push(descMd);
    if (pair.note) parts.push(pair.note);
    return parts.length ? parts.join(" ") : pair.note || "";
  }

  function getReferencesForPair(pair, excludeUrls = []) {
    const iosKey = pair.ios.id.replace(/^ios-/, "");
    const mdKey = pair.md.id.replace(/^md-/, "");
    const exclude = new Set(excludeUrls.filter(Boolean).map((u) => u.replace(/\/$/, "")));
    const seen = new Set();
    const out = [];
    for (const key of [iosKey, mdKey]) {
      const refs = references[key] || [];
      for (const r of refs) {
        const urlNorm = r.url.replace(/\/$/, "");
        if (seen.has(urlNorm) || exclude.has(urlNorm)) continue;
        seen.add(urlNorm);
        out.push(r);
      }
    }
    return out;
  }

  function refTypeLabel(type) {
    const labels = { doc: "Doc", tutorial: "Tutorial", example: "Ejemplo", comparison: "Comparación" };
    return labels[type] || "Referencia";
  }

  const levelBadgeClass = {
    alta: "comp-doc-badge-alta",
    media: "comp-doc-badge-media",
    baja: "comp-doc-badge-baja",
  };

  // Build pair slugs for routing
  const pairSlugs = pairs.map((p, i) => ({
    ...p,
    slug: `${slugify(p.ios.label)}-${slugify(p.md.label)}-${i}`,
  }));

  // Router
  function getRoute() {
    const hash = (location.hash || "#/").slice(1).replace(/^\/?/, "");
    const parts = hash ? hash.split("/") : [];
    const path = parts[0] || "";
    const rest = parts.slice(1);
    return { path: "/" + path, rest };
  }

  const TRANSITION_DURATION = 420;

  function renderWithTransition(html) {
    const inner = document.getElementById("page-content-inner");
    if (!inner) return;
    const hasContent = inner.innerHTML.trim().length > 0;
    if (hasContent) {
      inner.classList.add("page-transition-out");
      setTimeout(() => {
        inner.innerHTML = html;
        inner.classList.remove("page-transition-out");
      }, TRANSITION_DURATION);
    } else {
      inner.innerHTML = html;
    }
  }

  function renderPage(route) {
    const inner = document.getElementById("page-content-inner");
    if (!inner) return;

    if (route.path === "/" && !route.rest[0]) {
      renderWithTransition(`
        <div class="wiki-home">
          <div class="wiki-home-blobs" aria-hidden="true">
            <div class="wiki-blob wiki-blob-1"></div>
            <div class="wiki-blob wiki-blob-2"></div>
            <div class="wiki-blob wiki-blob-3"></div>
          </div>
          <div class="wiki-home-content">
            <div class="wiki-hero-card">
            <header class="wiki-hero wiki-hero-split">
              <div class="wiki-hero-left">
                <p class="wiki-hero-label">iOS ↔ Material Design</p>
                <h1 class="wiki-hero-title"><span class="hero-title-highlight hero-title-highlight-ios">Face</span> to <span class="hero-title-highlight hero-title-highlight-md">Face</span></h1>
                <p class="wiki-hero-sub">Una guía comparada de interfaces nativas</p>
              </div>
              <div class="wiki-hero-divider"></div>
              <div class="wiki-hero-right">
                <p class="wiki-hero-desc">Un repo para comparar componentes de iOS y Material Design y entender qué cambia, qué se parece y qué no entre ambas plataformas.</p>
                <div class="wiki-hero-ctas">
                  <a href="#/component/${pairSlugs[0]?.slug || ""}" class="wiki-hero-btn wiki-hero-btn-primary">Explorar componentes →</a>
                  <a href="#/about" class="wiki-hero-btn wiki-hero-btn-secondary">Sobre el proyecto</a>
                </div>
              </div>
            </header>
            <div class="wiki-hero-grid">
              <a href="#/" class="wiki-hero-block wiki-hero-block-correspondencias">
                <span class="wiki-hero-block-icon wiki-hero-block-icon-ios">${icons.apple || ""}</span>
                <span class="wiki-hero-block-icon wiki-hero-block-icon-android">${icons.android || ""}</span>
                <h3 class="wiki-hero-block-title">Correspondencias</h3>
                <p class="wiki-hero-block-desc">Equivalencias entre componentes de iOS y Material, clasificadas por nivel de correspondencia: alta, media o baja.</p>
              </a>
              <div class="wiki-hero-block-divider"></div>
              <a href="#/component/${pairSlugs[0]?.slug || ""}" class="wiki-hero-block wiki-hero-block-accent">
                <span class="wiki-hero-block-icon">${icons.designSystem || ""}</span>
                <h3 class="wiki-hero-block-title">Documentación</h3>
                <p class="wiki-hero-block-desc">Acceso directo a la documentación oficial de Apple, Google, sus SDK y recursos relacionados en Figma.</p>
              </a>
              <div class="wiki-hero-block-divider"></div>
              <div class="wiki-hero-block">
                <span class="wiki-hero-block-icon">${icons.figma || ""}</span>
                <h3 class="wiki-hero-block-title">Referencias</h3>
                <p class="wiki-hero-block-desc">Tutoriales, lecturas y ejemplos útiles para entender cada componente en su contexto real de uso.</p>
              </div>
            </div>
            </div>
            <section class="wiki-home-legend" aria-labelledby="wiki-legend-heading">
              <h2 id="wiki-legend-heading" class="wiki-home-h2">Nivel de correspondencia</h2>
              <div class="wiki-legend-table-wrap">
                <div class="wiki-legend-table-surface">
                <table class="wiki-legend-matrix" aria-labelledby="wiki-legend-heading">
                  <tbody>
                    <tr>
                      <th scope="row">
                        <span class="wiki-legend-th-inner"><span class="wiki-badge wiki-badge-alta">Alta</span></span>
                      </th>
                      <td>Función muy similar y misma intención de uso en la mayoría de productos.</td>
                    </tr>
                    <tr>
                      <th scope="row">
                        <span class="wiki-legend-th-inner"><span class="wiki-badge wiki-badge-media">Media</span></span>
                      </th>
                      <td>Relación clara, pero cambian contexto, comportamiento o implementación según plataforma.</td>
                    </tr>
                    <tr>
                      <th scope="row">
                        <span class="wiki-legend-th-inner"><span class="wiki-badge wiki-badge-baja">Baja</span></span>
                      </th>
                      <td>Relación orientativa: comparten lógica, no son equivalentes ni intercambiables.</td>
                    </tr>
                  </tbody>
                </table>
                </div>
              </div>
            </section>
          </div>
        </div>
      `);
      return;
    }

    if (route.path === "/foundations") {
      const sub = route.rest[0] || "";
      const pages = {
        "": { title: "Foundations", desc: "Tipografía, color, espaciados y otros fundamentos de HIG y Material Design." },
        "perfil-color": { title: "Perfil de color", desc: "Comparativa de espacios de color, P3, sRGB y gestión de color entre iOS y Material Design." },
        "medidas": { title: "Medidas dp/sp y pt", desc: "Sistemas de unidades: density-independent pixels (dp/sp) en Android y points (pt) en iOS." },
      };
      const page = pages[sub] || pages[""];
      renderWithTransition(`
        <section class="wiki-section">
          <a href="#/" class="comp-back">← Volver</a>
          <h1 class="wiki-h1">${escapeHtml(page.title)}</h1>
          <div class="wiki-block">
            <p class="wiki-p" style="margin-bottom: 0;">${escapeHtml(page.desc)} <strong>Sección en construcción.</strong></p>
          </div>
        </section>
      `);
      return;
    }

    if (route.path === "/recursos") {
      renderWithTransition(`
        <section class="wiki-section">
          <a href="#/" class="comp-back">← Volver</a>
          <h1 class="wiki-h1">Recursos</h1>
          <div class="wiki-block">
            <p class="wiki-p" style="margin-bottom: 1rem;">Kits de diseño, plantillas, herramientas y otros recursos útiles para trabajar con iOS y Material Design.</p>

            <h2 class="wiki-about-h3" style="margin-top: 1.5rem;">Herramientas Material</h2>
            <p class="wiki-p" style="margin-bottom: 1rem; font-size: 0.875rem; color: #64748b;">Genera temas personalizados y exporta tokens para tu proyecto.</p>
            <div class="wiki-kits-grid" style="margin-bottom: 2rem;">
              <a href="https://material-foundation.github.io/material-theme-builder/" target="_blank" rel="noopener" class="wiki-kit-card" title="Material Theme Builder — Crear temas M3">
                <div class="wiki-kit-cover wiki-kit-cover-icon" style="background: linear-gradient(135deg, #6750A4 0%, #7F67BE 100%); display: flex; align-items: center; justify-content: center; aspect-ratio: 16/10;">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="white" opacity="0.9"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93z"/></svg>
                </div>
                <span class="wiki-kit-title">Material Theme Builder</span>
                <span class="wiki-kit-meta">material-foundation · GitHub</span>
                <span class="wiki-kit-dates">Dynamic color, paletas HCT, export a código</span>
              </a>
            </div>

            <h2 class="wiki-about-h3" style="margin-top: 1.5rem;">UI Kits oficiales</h2>
            <p class="wiki-p" style="margin-bottom: 1rem; font-size: 0.875rem; color: #64748b;">Descarga los kits completos en Figma.</p>
            <div class="wiki-kits-grid">
              <a href="https://www.figma.com/community/file/1035203688168086460" target="_blank" rel="noopener" class="wiki-kit-card">
                <img src="assets/cover-material3.png" alt="Material 3 Design Kit" class="wiki-kit-cover" />
                <span class="wiki-kit-title">Material 3 Design Kit</span>
                <span class="wiki-kit-meta">Figma Community</span>
                <span class="wiki-kit-dates">Última actualización: 3 feb 2026</span>
              </a>
              <a href="https://www.figma.com/community/file/1527721578857867021" target="_blank" rel="noopener" class="wiki-kit-card">
                <img src="assets/cover-ios26.png" alt="iOS and iPadOS 26 UI Kit" class="wiki-kit-cover" />
                <span class="wiki-kit-title">iOS and iPadOS 26 UI Kit</span>
                <span class="wiki-kit-meta">Apple Design Resources</span>
                <span class="wiki-kit-dates">Última actualización: 17 mar 2026</span>
              </a>
            </div>
          </div>
        </section>
      `);
      return;
    }

    if (route.path === "/about") {
      renderWithTransition(`
        <section class="wiki-about">
          <a href="#/" class="comp-back">← Volver</a>

          <p class="wiki-about-lead">Un repo para comparar componentes de iOS y Material Design y entender qué cambia, qué se parece y qué no entre ambas plataformas.</p>

          <p class="wiki-about-p">Proyecto creado para dar soporte al curso <strong>Diseño y desarrollo de UI para apps</strong> de <a href="https://www.shiftr.pro/" target="_blank" rel="noopener" class="wiki-about-link">Shift+R</a>.</p>

          <p class="wiki-about-p">El objetivo es documentar las correspondencias entre las <a href="https://developer.apple.com/design/human-interface-guidelines/" target="_blank" rel="noopener" class="wiki-about-link">Human Interface Guidelines</a> y <a href="https://m3.material.io/" target="_blank" rel="noopener" class="wiki-about-link">Material Design 3</a>, ofreciendo niveles de coincidencia, enlaces a documentación oficial, SDKs y kits de Figma para diseñadores y desarrolladores que trabajan en múltiples plataformas.</p>

          <p class="wiki-about-p">Todas las correspondencias han sido investigadas y validadas al 100% de forma manual frente a la documentación oficial de HIG y M3.</p>

          <p class="wiki-about-p wiki-about-tagline">Una referencia viva que evoluciona con las actualizaciones de HIG y Material Design, hecha con cariño para la comunidad de diseño.</p>

          <div class="wiki-about-block">
            <p class="wiki-about-p" style="margin-bottom: 0.75rem;">Este proyecto es impulsado por la comunidad, diseñado como un recurso donde la gente puede aprender, comparar y tomar decisiones informadas al diseñar para iOS y Android.</p>
            <a href="#/component/${pairSlugs[0]?.slug || ""}" class="wiki-about-cta">Explorar componentes →</a>
          </div>

          <div class="wiki-about-kits">
            <h3 class="wiki-about-h3 wiki-about-h3-highlight"><span class="hero-title-highlight hero-title-highlight-ios">UI Kits</span> <span class="hero-title-highlight hero-title-highlight-md">oficiales</span></h3>
            <p class="wiki-about-p" style="margin-bottom: 1rem;">Descarga los kits completos en Figma.</p>
            <div class="wiki-kits-grid">
              <a href="https://www.figma.com/community/file/1035203688168086460" target="_blank" rel="noopener" class="wiki-kit-card">
                <img src="assets/cover-material3.png" alt="Material 3 Design Kit" class="wiki-kit-cover" />
                <span class="wiki-kit-title">Material 3 Design Kit</span>
                <span class="wiki-kit-meta">Figma Community</span>
                <span class="wiki-kit-dates">Última actualización: 3 feb 2026</span>
              </a>
              <a href="https://www.figma.com/community/file/1527721578857867021" target="_blank" rel="noopener" class="wiki-kit-card">
                <img src="assets/cover-ios26.png" alt="iOS and iPadOS 26 UI Kit" class="wiki-kit-cover" />
                <span class="wiki-kit-title">iOS and iPadOS 26 UI Kit</span>
                <span class="wiki-kit-meta">Apple Design Resources</span>
                <span class="wiki-kit-dates">Última actualización: 17 mar 2026</span>
              </a>
            </div>
          </div>

          <div class="wiki-about-meta">
            <div class="wiki-about-meta-item">
              <span class="wiki-about-meta-label">Estado</span>
              <span class="wiki-about-meta-value">Activo y en crecimiento</span>
            </div>
            <div class="wiki-about-meta-item">
              <span class="wiki-about-meta-label">Actualizado</span>
              <span class="wiki-about-meta-value">Marzo 2026</span>
            </div>
          </div>

          <div class="wiki-about-credits">
            <h3 class="wiki-about-h3 wiki-about-h3-highlight"><span class="hero-title-highlight hero-title-highlight-ios">Inspiraciones</span> <span class="hero-title-highlight hero-title-highlight-md">y créditos</span></h3>
            <p class="wiki-about-p">Inspirado por la claridad de las guías oficiales de diseño y la necesidad de herramientas de referencia multiplataforma.</p>
            <p class="wiki-about-p">Construido con vanilla JS, Tailwind CSS y Cursor.</p>
            <p class="wiki-about-p" style="margin-bottom: 0;">Gracias a Apple y Google por las Human Interface Guidelines y la documentación de Material Design.</p>
          </div>

          <div class="wiki-about-madeby">
            <h3 class="wiki-about-h3 wiki-about-h3-highlight"><span class="hero-title-highlight hero-title-highlight-ios">Hecho</span> <span class="hero-title-highlight hero-title-highlight-md">por</span></h3>
            <div class="wiki-about-shiftr">
              <img src="assets/shift-r-logo.png" alt="Shift+R" class="wiki-about-shiftr-logo" width="40" height="40" />
              <p class="wiki-about-p" style="margin-bottom: 0;">Una escuela especializada en Design Systems desde 2021, enseñando tecnologías emergentes como MCPs, herramientas de IA para diseñadores y prácticas de diseño de vanguardia, incluyendo UI para apps de iOS y Android.</p>
            </div>
            <a href="https://www.shiftr.pro/" target="_blank" rel="noopener" class="wiki-about-link">shiftr.pro</a>
          </div>
        </section>
      `);
      return;
    }

    if (route.path === "/orphans") {
      const side = route.rest[0] || "ios";
      const list = side === "md" ? orphansMd : orphansIos;
      const title = side === "md" ? "Material 3 — Sin correspondencia" : "iOS — Sin correspondencia";

      const iosPatterns = [
        { label: "Wallet", url: "https://www.figma.com/community/file/1367917956770293718", thumb: "assets/pattern-wallet.png" },
        { label: "TipKit", url: "https://www.figma.com/community/file/1367917705471226837", thumb: "assets/pattern-tipkit.png" },
        { label: "Tap to Pay on iPhone", url: "https://www.figma.com/community/file/1367917199004804052", thumb: "assets/pattern-tap-to-pay.png" },
        { label: "App Intents & Shortcuts", url: "https://www.figma.com/community/file/1367916969551216595", thumb: "assets/pattern-app-intents.png" },
        { label: "Sign in with Apple", url: "https://www.figma.com/community/file/1367916685468040146", thumb: "assets/pattern-sign-in-with-apple.png" },
        { label: "iMessage Apps and Stickers", url: "https://www.figma.com/community/file/1367916269438172112", thumb: "assets/pattern-messages.png" },
        { label: "Live Activities", url: "https://www.figma.com/community/file/1367915437752334285", thumb: "assets/pattern-live-activities.png" },
        { label: "Apple Pay", url: "https://www.figma.com/community/file/1367915141082663884", thumb: "assets/pattern-apple-pay.png" },
        { label: "App Clips", url: "https://www.figma.com/community/file/1367914571662801866", thumb: "assets/pattern-app-clips.png" },
      ];

      function renderOrphan(node) {
        return `
          <div class="orphan-card" title="${escapeHtml(node.note || "")}">
            <span class="orphan-card-label">${escapeHtml(node.label)}</span>
            <span class="orphan-card-tag">WIP</span>
          </div>
        `;
      }

      const patternsSection = side === "ios" ? `
        <h2 class="orphan-patterns-title"><span class="hero-title-highlight hero-title-highlight-ios">Patrones y plantillas de Apple</span></h2>
        <p class="wiki-p" style="margin-bottom: 1rem; font-size: 0.875rem; color: #64748b;">Recursos de Apple Design en Figma para patrones específicos de iOS.</p>
        <div class="orphan-patterns">
          ${iosPatterns.map((p) => `
            <a href="${escapeHtml(p.url)}" target="_blank" rel="noopener" class="orphan-pattern-link" title="${escapeHtml(p.label)}">
              <span class="orphan-pattern-avatar">
                <img src="${escapeHtml(p.thumb)}" alt="" class="orphan-pattern-thumb" loading="lazy" />
              </span>
              <span class="orphan-pattern-label">${escapeHtml(p.label)}</span>
              <span class="orphan-pattern-icon">→</span>
            </a>
          `).join("")}
        </div>
      ` : "";

      const platformIcon = side === "ios" ? icons.apple : icons.android;
      renderWithTransition(`
        <section class="wiki-section">
          <a href="#/" class="comp-back">← Volver</a>
          <h1 class="wiki-h1 wiki-h1-with-icon"><span class="ref-icon">${platformIcon || ""}</span>${escapeHtml(title)}</h1>
          <p class="wiki-p">Componentes que no tienen equivalente directo en la otra plataforma.</p>
          <div class="orphan-cards">
            ${list.length > 0 ? list.map(renderOrphan).join("") : '<span class="orphan-empty">Ninguno</span>'}
          </div>
          ${patternsSection}
        </section>
      `);
      return;
    }

    if (route.path === "/component") {
      const slug = route.rest[0];
      const pair = pairSlugs.find((p) => p.slug === slug);
      if (!pair) {
        renderWithTransition(`<section class="wiki-section"><p class="text-slate-500">Componente no encontrado. <a href="#/">Volver al overview</a></p></section>`);
        return;
      }

      const li = getLinks(pair.ios.id);
      const lm = getLinks(pair.md.id);
      const badgeClass = levelBadgeClass[pair.level] || "comp-doc-badge-baja";

      const figmaRefLinks = [];
      if (li.figma) figmaRefLinks.push(linkEl(li.figma, "iOS UI Kit", "comp-ref-link"));
      if (lm.figma) figmaRefLinks.push(linkEl(lm.figma, "Material 3 UI Kit", "comp-ref-link"));
      const figmaRefSection = figmaRefLinks.length ? `
          <div class="comp-reference">
            <h3 class="comp-ref-title">Reference</h3>
            <div class="comp-ref-figma">
              <span class="comp-ref-figma-label"><span class="ref-icon">${icons.figma || ""}</span>Figma</span>
              <div class="comp-ref-figma-links">${figmaRefLinks.join("")}</div>
            </div>
          </div>
          ` : "";

      const figmaSection = (li.figmaEmbed || lm.figmaEmbed) ? `
        <div class="comp-screenshots mt-8">
          <p class="comp-anatomy-label comp-anatomy-label-icons">
            <span class="ref-icon">${icons.figma || ""}</span> Vista previa · Figma
          </p>
          <div class="comp-figma-grid">
            ${li.figmaEmbed ? `
              <div class="figma-preview">
                <p class="figma-preview-label"><span class="ref-icon">${icons.apple || ""}</span>${escapeHtml(pair.ios.label)} · iOS</p>
                <iframe class="figma-embed" src="${escapeHtml(li.figmaEmbed)}" allowfullscreen></iframe>
              </div>
            ` : ""}
            ${lm.figmaEmbed ? `
              <div class="figma-preview">
                <p class="figma-preview-label"><span class="ref-icon">${icons.android || ""}</span>${escapeHtml(pair.md.label)} · Material 3</p>
                <iframe class="figma-embed" src="${escapeHtml(lm.figmaEmbed)}" allowfullscreen></iframe>
              </div>
            ` : ""}
          </div>
        </div>
      ` : "";

      const extDesc = getExtendedDescription(pair);
      const excludeFromRefs = [li.doc, li.sdk, lm.doc, lm.sdk];
      const refsList = getReferencesForPair(pair, excludeFromRefs);
      const refsHtml = refsList.length
        ? refsList.map((r) => `
            <a href="${escapeHtml(r.url)}" target="_blank" rel="noopener" class="comp-ref-item">
              <span class="comp-ref-item-badge comp-ref-item-badge-${r.type || "doc"}">${escapeHtml(refTypeLabel(r.type))}</span>
              <span class="comp-ref-item-title">${escapeHtml(r.title)}</span>
            </a>
          `).join("")
        : "";

      renderWithTransition(`
        <div class="comp-page-layout">
          <article class="comp-page comp-page-main">
            <a href="#/" class="comp-back">← Volver</a>
            <header class="comp-hero">
              <h1 class="comp-hero-title">${escapeHtml(pair.ios.label)} ↔ ${escapeHtml(pair.md.label)}</h1>
              <span class="comp-badge comp-badge-${pair.level}">${escapeHtml(pair.level)}</span>
            </header>
            ${extDesc ? `<div class="comp-desc"><p>${escapeHtml(extDesc)}</p></div>` : ""}
            <div class="comp-cards">
              <div class="comp-card comp-card-ios">
                <div class="comp-card-icon">${icons.apple || ""}</div>
                <div class="comp-card-body">
                  <h2 class="comp-card-title">${escapeHtml(pair.ios.label)}</h2>
                  <p class="comp-card-meta">iOS · Human Interface Guidelines</p>
                  <div class="comp-card-links">
                    ${li.doc ? cardBtn(li.doc, "Design system", "designSystem") : ""}
                    ${li.sdk ? cardBtn(li.sdk, "SDK", "sdk") : ""}
                  </div>
                </div>
              </div>
              <div class="comp-card comp-card-md">
                <div class="comp-card-icon">${icons.android || ""}</div>
                <div class="comp-card-body">
                  <h2 class="comp-card-title">${escapeHtml(pair.md.label)}</h2>
                  <p class="comp-card-meta">Material Design 3</p>
                  <div class="comp-card-links">
                    ${lm.doc ? cardBtn(lm.doc, "Design system", "designSystem") : ""}
                    ${lm.sdk ? cardBtn(lm.sdk, "SDK", "sdk") : ""}
                  </div>
                </div>
              </div>
            </div>
            ${figmaRefSection}
            ${figmaSection}
          </article>
          ${refsHtml ? `
          <aside class="comp-refs-sidebar">
            <h3 class="comp-refs-title">Para profundizar</h3>
            <p class="comp-refs-desc">Documentación, tutoriales y lecturas que ayudan a entender este componente.</p>
            <div class="comp-refs-list">${refsHtml}</div>
          </aside>
          ` : ""}
        </div>
      `);
      return;
    }

    renderWithTransition(`<section class="wiki-section"><p class="text-slate-500">Página no encontrada. <a href="#/">Volver al overview</a></p></section>`);
  }

  function navigate() {
    const route = getRoute();
    if (route.path === "/component") {
      renderPage({ path: "/component", rest: route.rest });
    } else if (route.path === "/orphans") {
      renderPage({ path: "/orphans", rest: route.rest });
    } else if (route.path === "/about") {
      renderPage({ path: "/about", rest: [] });
    } else if (route.path === "/foundations") {
      renderPage({ path: "/foundations", rest: route.rest });
    } else if (route.path === "/recursos") {
      renderPage({ path: "/recursos", rest: [] });
    } else {
      renderPage(route);
    }
    updateActiveLink();
  }

  // Sidebar: lista de pares
  const sidebarPairs = document.getElementById("sidebar-pairs");
  if (sidebarPairs) {
    const seen = new Set();
    pairSlugs.forEach((p) => {
      if (seen.has(p.slug)) return;
      seen.add(p.slug);
      const li = document.createElement("li");
      li.className = "wiki-nav-item";
      li.dataset.searchText = `${p.ios.label} ${p.md.label}`.toLowerCase();
      const a = document.createElement("a");
      a.href = `#/component/${p.slug}`;
      a.className = "wiki-nav-link wiki-nav-link-pair";
      a.dataset.route = `/component/${p.slug}`;
      a.dataset.platform = "both";
      const label = `${p.ios.label} ↔ ${p.md.label}`;
      a.title = label;
      a.innerHTML = `<span class="nav-link-text"><span class="nav-label-ios">${escapeHtml(p.ios.label)}</span><span class="nav-sep"> ↔ </span><span class="nav-label-md">${escapeHtml(p.md.label)}</span></span>`;
      li.appendChild(a);
      sidebarPairs.appendChild(li);
    });
    document.getElementById("pairs-count").textContent = `(${sidebarPairs.children.length})`;
  }

  // Búsqueda en el listado
  document.getElementById("sidebar-search")?.addEventListener("input", (e) => {
    const q = (e.target.value || "").trim().toLowerCase();
    const items = document.querySelectorAll("#sidebar-pairs .wiki-nav-item");
    let visible = 0;
    items.forEach((li) => {
      const match = !q || li.dataset.searchText.includes(q);
      li.hidden = !match;
      if (match) visible++;
    });
    const noResults = document.getElementById("sidebar-no-results");
    if (noResults) noResults.hidden = !q || visible > 0;
  });

  // Sección colapsable
  document.getElementById("toggle-pairs")?.addEventListener("click", () => {
    const section = document.querySelector(".wiki-nav-section-toggle");
    const list = document.getElementById("sidebar-pairs");
    const noResults = document.getElementById("sidebar-no-results");
    const btn = document.getElementById("toggle-pairs");
    const icon = btn?.querySelector(".wiki-nav-toggle-icon");
    section?.classList.toggle("collapsed");
    const isCollapsed = section?.classList.contains("collapsed");
    if (list) list.hidden = isCollapsed;
    if (noResults) noResults.hidden = isCollapsed;
    btn?.setAttribute("aria-expanded", String(!isCollapsed));
    if (icon) icon.style.transform = isCollapsed ? "rotate(-90deg)" : "rotate(0)";
  });

  function updateActiveLink() {
    const route = getRoute();
    let activeRoute = "/";
    if (route.path === "/component") activeRoute = `/component/${route.rest[0] || ""}`;
    else if (route.path === "/orphans") activeRoute = `/orphans/${route.rest[0] || "ios"}`;
    else if (route.path === "/about") activeRoute = "/about";
    else if (route.path === "/recursos") activeRoute = "/recursos";
    else if (route.path === "/foundations") activeRoute = route.rest[0] ? `/foundations/${route.rest[0]}` : "/foundations";

    document.querySelectorAll(".wiki-nav-link").forEach((a) => {
      const href = a.getAttribute("href") || "";
      const linkRoute = href.startsWith("#/component/") ? `/component/${href.split("/").pop()}` :
        href === "#/orphans/ios" ? "/orphans/ios" : href === "#/orphans/md" ? "/orphans/md" :
        href === "#/recursos" ? "/recursos" :
        href.startsWith("#/foundations/") ? href.slice(1).replace("#", "") : href === "#/foundations" ? "/foundations" : "/";
      a.classList.toggle("active", linkRoute === activeRoute);
    });

    document.querySelectorAll(".header-about").forEach((a) => {
      a.classList.toggle("active", activeRoute === "/about");
    });

    document.querySelectorAll(".wiki-sidebar-about-link").forEach((a) => {
      a.classList.toggle("active", activeRoute === "/about");
    });

    document.querySelectorAll(".header-home").forEach((a) => {
      a.classList.toggle("active", activeRoute === "/");
    });
  }

  window.addEventListener("hashchange", navigate);
  navigate();

  document.getElementById("sidebar-toggle")?.addEventListener("click", () => {
    document.getElementById("sidebar")?.classList.toggle("open");
  });

  const THEME_KEY = "face2face-theme";
  const body = document.body;

  function applyTheme(theme) {
    body.setAttribute("data-theme", theme);
    document.querySelectorAll(".theme-toggle-btn").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.theme === theme);
    });
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch (_) {}
  }

  const storedTheme = localStorage.getItem(THEME_KEY);
  const normalizedTheme = storedTheme === "liquid" ? "default" : storedTheme;
  if (normalizedTheme === "default" || normalizedTheme === "material" || normalizedTheme === "tahoe") {
    applyTheme(normalizedTheme);
  } else {
    document.querySelector(".theme-toggle-btn[data-theme='default']")?.classList.add("active");
  }

  document.querySelectorAll(".theme-toggle-btn").forEach((btn) => {
    btn.addEventListener("click", () => applyTheme(btn.dataset.theme));
  });

  document.querySelectorAll(".wiki-nav-link, .header-home, .header-about, .wiki-sidebar-about-link").forEach((a) => {
    a.addEventListener("click", () => {
      if (window.matchMedia("(max-width: 1024px)").matches) {
        document.getElementById("sidebar")?.classList.remove("open");
      }
    });
  });

  document.getElementById("material-fab")?.addEventListener("click", (e) => {
    if (body.getAttribute("data-theme") !== "material") return;
    if (e.detail === 2) {
      const main = document.querySelector(".wiki-main");
      if (main) {
        main.classList.add("page-shake");
        main.addEventListener("animationend", () => main.classList.remove("page-shake"), { once: true });
      }
      return;
    }
    window.__MATERIAL_COLOR_PICKER__?.open?.();
  });
})();
