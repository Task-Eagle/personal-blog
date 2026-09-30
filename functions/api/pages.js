import { error, json, readJson } from "../_lib/http.js";
import { isAdmin, requireAdmin } from "../_lib/auth.js";
import { excerptFrom, navPage, publicPage, uniqueSlug } from "../_lib/pages.js";

export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const admin = await isAdmin(context);
  const wantAll = url.searchParams.get("all") === "1";

  if (wantAll && !admin) return error("Sign in required.", 401);

  const sql = wantAll
    ? "SELECT id, slug, title, excerpt, content, published, created_at, updated_at FROM pages ORDER BY created_at DESC"
    : "SELECT id, slug, title, excerpt, created_at, updated_at FROM pages WHERE published = 1 ORDER BY created_at DESC";

  const { results } = await context.env.DB.prepare(sql).all();
  const pages = (results || []).map((row) =>
    wantAll ? publicPage(row) : navPage(row)
  );
  return json({ pages });
}

export async function onRequestPost(context) {
  const denied = await requireAdmin(context);
  if (denied) return denied;

  const body = await readJson(context.request);
  if (!body) return error("Invalid JSON.", 400);

  const title = typeof body.title === "string" ? body.title.trim() : "";
  const content = typeof body.content === "string" ? body.content : "";
  if (!title) return error("Title is required.", 400);
  if (title.length > 200) return error("Title is too long.", 400);
  if (content.length > 200_000) return error("Post is too long.", 400);

  const id = crypto.randomUUID();
  const slug = await uniqueSlug(context.env.DB, body.slug || title);
  const now = new Date().toISOString();
  const published = body.published === false || body.published === 0 ? 0 : 1;
  const excerpt = excerptFrom(content, title);

  await context.env.DB.prepare(
    `INSERT INTO pages (id, slug, title, content, excerpt, published, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(id, slug, title, content, excerpt, published, now, now)
    .run();

  const row = await context.env.DB.prepare("SELECT * FROM pages WHERE id = ?")
    .bind(id)
    .first();
  return json({ page: publicPage(row) }, 201);
}
