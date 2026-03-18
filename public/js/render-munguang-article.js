/**
 * Carga /textos/munguang-full.txt, genera índice, secciones y notas.
 */
(function () {
  /** Misma carpeta public: sirve con Express y con rutas relativas si falla la absoluta */
  function textUrlCandidates() {
    const base = typeof location !== "undefined" ? location.pathname : "";
    const sameDir = base.replace(/[^/]+$/, "") + "textos/munguang-full.txt";
    return ["/textos/munguang-full.txt", sameDir, "./textos/munguang-full.txt"];
  }

  function cleanRaw(s) {
    let t = s.replace(/\r\n/g, "\n");
    t = t.replace(/\n\d+\s*MUNGUANG\s*\n/gi, "\n");
    t = t.replace(/\nTEORÍA DEL HUMANISMO\s+\d+\s*\n/gi, "\n");
    t = t.replace(/\n\d{3}\s*MUNGUANG\s*\n/gi, "\n");
    t = t.replace(/([a-záéíóúüñ])-\s*\n\s*([a-záéíóúüñ])/gi, "$1$2");
    t = t.replace(/\n{3,}/g, "\n\n");
    return t.trim();
  }

  function escapeHtml(s) {
    return s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  /** Línea de sección: 3.1 Título o 4. TÍTULO (no "1 N. del T.") */
  function isSectionLine(line) {
    const sub = line.match(/^(\d+)\.(\d+)\s+(.+)/);
    if (sub) return { num: sub[1] + "." + sub[2], title: sub[3].trim() };
    const main = line.match(/^(\d+)\.\s+(.+)/);
    if (!main) return null;
    const rest = main[2].trim();
    if (/^N\.\s+del\s+T\./i.test(rest)) return null;
    if (!/^[A-ZÁÉÍÓÚÑ"(“0-9]/.test(rest)) return null;
    return { num: main[1], title: rest };
  }

  function parseSections(mainText) {
    const lines = mainText.split("\n");
    const sections = [];
    let cur = null;
    const body = [];

    function flush() {
      if (cur) {
        const bodyText = body.join("\n").trim();
        const paras = bodyText
          .split(/\n\n+/)
          .map((p) => p.replace(/\n/g, " ").replace(/\s+/g, " ").trim())
          .filter(Boolean);
        sections.push({ num: cur.num, title: cur.title, paragraphs: paras });
      }
      body.length = 0;
    }

    for (const line of lines) {
      const sec = isSectionLine(line.trim());
      if (sec) {
        flush();
        cur = sec;
      } else {
        body.push(line);
      }
    }
    flush();
    return sections;
  }

  function parseFootnotes(block) {
    const items = [];
    const paras = block.split(/\n\n+/).map((p) => p.replace(/\n/g, " ").replace(/\s+/g, " ").trim()).filter(Boolean);
    for (const p of paras) {
      const m = p.match(/^(\d{1,2})\s+(.+)/s);
      if (m) items.push({ n: parseInt(m[1], 10), text: m[2].trim() });
    }
    items.sort((a, b) => a.n - b.n);
    return items;
  }

  function isKimQuote(p) {
    return /La composición poética\s*\[meditación zen/i.test(p) || /^[""„«]La composición/i.test(p);
  }

  function renderParagraph(p) {
    const html = escapeHtml(p);
    if (isKimQuote(p)) {
      return '<blockquote class="pullquote"><p>' + html + "</p></blockquote>";
    }
    return "<p>" + html + "</p>";
  }

  async function run() {
    const mount = document.getElementById("article-body");
    const loading = document.getElementById("article-loading");
    if (!mount) return;

    try {
      let raw = "";
      const fallbackEl = document.getElementById("munguang-fallback");
      const fallback = fallbackEl ? fallbackEl.textContent : "";

      for (const url of textUrlCandidates()) {
        try {
          const res = await fetch(url, { cache: "no-store" });
          if (res.ok) {
            raw = await res.text();
            break;
          }
        } catch (_) {
          /* siguiente URL */
        }
      }
      if (!raw && fallback) {
        raw = fallback;
      }
      if (!raw) {
        throw new Error("No se pudo cargar el texto (textos/munguang-full.txt).");
      }
      let text = cleanRaw(raw);

      let footnotes = [];
      const notasIdx = text.indexOf("\n---NOTAS---\n");
      if (notasIdx !== -1) {
        const notesBlock = text.slice(notasIdx + "\n---NOTAS---\n".length).trim();
        text = text.slice(0, notasIdx).trim();
        footnotes = parseFootnotes(notesBlock);
      }

      const sections = parseSections(text);
      if (!sections.length) throw new Error("No se detectaron secciones (use encabezados como «1. PRELIMINAR» al inicio de línea).");

      let toc = '<nav class="article-toc"><h2>Índice</h2><ol>';
      let main = "";

      sections.forEach((sec) => {
        const id = "sec-" + String(sec.num).replace(/\./g, "-");
        const label = sec.num + " " + sec.title;
        toc += '<li><a href="#' + id + '">' + escapeHtml(label) + "</a></li>";
        main += '<section class="article-section" id="' + id + '"><h2>' + escapeHtml(label) + "</h2>";
        sec.paragraphs.forEach((p) => {
          main += renderParagraph(p);
        });
        main += "</section>";
      });

      toc += "</ol></nav>";

      let fnHtml = "";
      if (footnotes.length) {
        fnHtml = '<section class="article-footnotes"><h2>Notas</h2><ol>';
        footnotes.forEach((f) => {
          fnHtml += "<li value=\"" + f.n + "\">" + escapeHtml(f.text) + "</li>";
        });
        fnHtml += "</ol></section>";
      }

      mount.innerHTML = toc + main + fnHtml;
      if (loading) loading.style.display = "none";
    } catch (e) {
      if (loading) {
        loading.className = "article-error";
        loading.innerHTML =
          "<p><strong>" +
          escapeHtml(e.message) +
          "</strong></p><p>Para generar el archivo de texto, en la raíz del proyecto ejecute:</p><pre>node scripts/merge-munguang-text.mjs</pre>";
      }
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run);
  } else {
    run();
  }
})();
