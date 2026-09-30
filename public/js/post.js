import { paintChrome, getJson, formatDate, renderMarkdown, escapeHtml } from "./common.js";

function slugFromLocation() {
  const params = new URLSearchParams(location.search);
  const fromQuery = params.get("slug") || params.get("id");
  if (fromQuery) return fromQuery;

  const parts = location.pathname.split("/").filter(Boolean);
  const pIndex = parts.indexOf("p");
  if (pIndex >= 0 && parts[pIndex + 1] && parts[pIndex + 1] !== "post.html") {
    return decodeURIComponent(parts[pIndex + 1]);
  }
  return "";
}

const slug = slugFromLocation();
const article = document.querySelector("[data-article]");

try {
  if (!slug) throw new Error("Missing post id.");
  const { page } = await getJson(`/api/pages/${encodeURIComponent(slug)}`);
  await paintChrome(page.slug);
  document.title = page.title;
  article.innerHTML = `
    <p class="meta">${formatDate(page.created_at)}</p>
    <h1>${escapeHtml(page.title)}</h1>
    <div class="md">${renderMarkdown(page.content)}</div>
  `;
} catch (err) {
  await paintChrome();
  document.title = "Not found";
  article.innerHTML = `
    <h1>Post not found</h1>
    <p class="excerpt">${escapeHtml(err.message)}</p>
    <p><a href="/">Back home</a></p>
  `;
}
