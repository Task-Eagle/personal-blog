export async function getJson(url) {
  const res = await fetch(url, { credentials: "same-origin" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

export async function sendJson(url, method, body) {
  const res = await fetch(url, {
    method,
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

export function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function renderMarkdown(source) {
  const raw = window.marked.parse(source || "", { async: false });
  return window.DOMPurify.sanitize(raw);
}

export async function loadSettings() {
  try {
    return await getJson("/api/settings");
  } catch {
    return { site_name: "Field Notes", tagline: "A small personal blog." };
  }
}

export async function paintChrome(current = "") {
  const settings = await loadSettings();
  document.title = document.title.includes("|")
    ? document.title
    : `${document.title} | ${settings.site_name}`;

  const nameEl = document.querySelector("[data-site-name]");
  const tagEl = document.querySelector("[data-site-tagline]");
  if (nameEl) nameEl.textContent = settings.site_name;
  if (tagEl) tagEl.textContent = settings.tagline;

  let pages = [];
  try {
    const data = await getJson("/api/pages");
    pages = data.pages || [];
  } catch {
    pages = [];
  }

  const nav = document.querySelector("[data-nav]");
  if (nav) {
    const links = [
      `<a href="/" ${current === "home" ? 'aria-current="page"' : ""}>Home</a>`,
      ...pages.slice(0, 6).map(
        (p) =>
          `<a href="/post.html?slug=${encodeURIComponent(p.slug)}" ${
            current === p.slug ? 'aria-current="page"' : ""
          }>${escapeHtml(p.title)}</a>`
      ),
      `<a class="admin-link" href="/admin.html">Admin</a>`,
    ];
    nav.innerHTML = links.join("");
  }
  return { settings, pages };
}
