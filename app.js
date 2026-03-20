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
                <p class="wiki-hero-desc">Un archivo visual de correspondencias entre Human Interface Guidelines y Material Design 3. Consulta equivalencias entre componentes y patrones con documentación oficial, SDK, recursos en Figma y referencias adicionales para cada caso.</p>
                <div class="wiki-hero-ctas">
                  <a href="#/component/${pairSlugs[0]?.slug || ""}" class="wiki-hero-btn wiki-hero-btn-primary">Explorar componentes →</a>
                  <a href="#/about" class="wiki-hero-btn wiki-hero-btn-secondary">Sobre el proyecto</a>
                </div>
              </div>
            </header>
            <div class="wiki-hero-grid">
              <a href="#/" class="wiki-hero-block">
                <span class="wiki-hero-block-icon" style="color:#007AFF">${icons.apple || ""}</span>
                <span class="wiki-hero-block-icon" style="color:#3ddc84">${icons.android || ""}</span>
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
            <div class="wiki-home-legend">
              <h2 class="wiki-home-h2">Nivel de correspondencia</h2>
              <div class="wiki-legend-table">
                <div class="wiki-legend-row">
                  <span class="wiki-legend-label wiki-badge wiki-badge-alta">Alta</span>
                  <span class="wiki-legend-desc">Ambos componentes cumplen una función muy similar y suelen responder a la misma intención de uso en la mayoría de productos.</span>
                </div>
                <div class="wiki-legend-row">
                  <span class="wiki-legend-label wiki-badge wiki-badge-media">Media</span>
                  <span class="wiki-legend-desc">Existe una relación clara, pero cambian el contexto, el comportamiento o la implementación según la plataforma.</span>
                </div>
                <div class="wiki-legend-row">
                  <span class="wiki-legend-label wiki-badge wiki-badge-baja">Baja</span>
                  <span class="wiki-legend-desc">La relación es solo orientativa: comparten cierta lógica, pero no son equivalentes ni deberían tratarse como intercambiables.</span>
                </div>
              </div>
            </div>
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
            <p class="wiki-p" style="margin-bottom: 0;">Kits de diseño, plantillas, herramientas y otros recursos útiles para trabajar con iOS y Material Design. <strong>Sección en construcción.</strong></p>
          </div>
        </section>
      `);
      return;
    }

    if (route.path === "/about") {
      renderWithTransition(`
        <section class="wiki-about">
          <a href="#/" class="comp-back">← Volver</a>

          <p class="wiki-about-lead">A curated reference for iOS and Material Design component correspondences. It might sound obvious, but we believe the best way to design for both platforms is to understand what each system offers—and how they relate.</p>

          <p class="wiki-about-p">Our mission is to document the correspondences between Human Interface Guidelines and Material Design 3, providing levels of match, links to official docs, SDKs, and Figma kits for designers and developers working across platforms.</p>

          <p class="wiki-about-p">All correspondences have been 100% manually researched and validated against official HIG and M3 documentation.</p>

          <p class="wiki-about-p wiki-about-tagline">A living reference that evolves with HIG and Material Design updates, made with care for the design community.</p>

          <div class="wiki-about-block">
            <p class="wiki-about-p" style="margin-bottom: 0.75rem;">This project is community-driven, designed as a resource where people can learn, compare, and make informed decisions when designing for iOS and Android.</p>
            <a href="#/component/${pairSlugs[0]?.slug || ""}" class="wiki-about-cta">Explore components →</a>
          </div>

          <div class="wiki-about-meta">
            <div class="wiki-about-meta-item">
              <span class="wiki-about-meta-label">Status</span>
              <span class="wiki-about-meta-value">Active & growing</span>
            </div>
            <div class="wiki-about-meta-item">
              <span class="wiki-about-meta-label">Updated</span>
              <span class="wiki-about-meta-value">March 2026</span>
            </div>
          </div>

          <div class="wiki-about-credits">
            <h3 class="wiki-about-h3">Inspirations & credits</h3>
            <p class="wiki-about-p">Inspired by the clarity of official design guidelines and the need for cross-platform reference tools.</p>
            <p class="wiki-about-p">Built with vanilla JS, Tailwind CSS, and Cursor.</p>
            <p class="wiki-about-p" style="margin-bottom: 0;">Thanks to Apple and Google for the Human Interface Guidelines and Material Design documentation.</p>
          </div>

          <div class="wiki-about-madeby">
            <h3 class="wiki-about-h3">Made by</h3>
            <div class="wiki-about-shiftr">
              <img src="assets/shift-r-logo.png" alt="Shift+R" class="wiki-about-shiftr-logo" width="40" height="40" />
              <p class="wiki-about-p" style="margin-bottom: 0;">A school specialized in Design Systems since 2021, teaching emerging technologies like MCPs, AI tools for designers, and cutting-edge design practices including UI for iOS and Android apps.</p>
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

      function renderOrphan(node) {
        return `
          <div class="orphan-card" title="${escapeHtml(node.note || "")}">
            <span class="orphan-card-label">${escapeHtml(node.label)}</span>
            <span class="orphan-card-tag">WIP</span>
          </div>
        `;
      }

      const platformIcon = side === "ios" ? icons.apple : icons.android;
      renderWithTransition(`
        <section class="wiki-section">
          <a href="#/" class="comp-back">← Volver</a>
          <h1 class="wiki-h1 wiki-h1-with-icon"><span class="ref-icon">${platformIcon || ""}</span>${escapeHtml(title)}</h1>
          <p class="wiki-p">Componentes que no tienen equivalente directo en la otra plataforma.</p>
          <div class="orphan-cards">
            ${list.length > 0 ? list.map(renderOrphan).join("") : '<span class="orphan-empty">Ninguno</span>'}
          </div>
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

    document.querySelectorAll(".header-home").forEach((a) => {
      a.classList.toggle("active", activeRoute === "/");
    });
  }

  window.addEventListener("hashchange", navigate);
  navigate();

  document.getElementById("sidebar-toggle")?.addEventListener("click", () => {
    document.getElementById("sidebar")?.classList.toggle("open");
  });

  const FONT_KEY = "face2face-font";
  const body = document.body;

  function applyFont(font) {
    body.setAttribute("data-font", font);
    document.querySelectorAll(".font-toggle-btn").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.font === font);
    });
    try {
      localStorage.setItem(FONT_KEY, font);
    } catch (_) {}
  }

  const stored = localStorage.getItem(FONT_KEY);
  if (stored === "sf" || stored === "roboto") {
    applyFont(stored);
  } else {
    document.querySelector(".font-toggle-btn[data-font='sf']")?.classList.add("active");
  }

  document.querySelectorAll(".font-toggle-btn").forEach((btn) => {
    btn.addEventListener("click", () => applyFont(btn.dataset.font));
  });

  document.querySelectorAll(".wiki-nav-link, .header-home, .header-about").forEach((a) => {
    a.addEventListener("click", () => {
      if (window.matchMedia("(max-width: 1024px)").matches) {
        document.getElementById("sidebar")?.classList.remove("open");
      }
    });
  });
})();
