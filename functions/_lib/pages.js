export function slugify(input) {
  const base = String(input || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return base || "post";
}

export function excerptFrom(markdown, title = "") {
  const text = String(markdown || "")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/!\[[^\]]*\]\([^)]+\)/g, " ")
    .replace(/\[[^\]]*\]\([^)]+\)/g, " ")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/[*_>#-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!text) return title;
  return text.length > 180 ? `${text.slice(0, 177)}...` : text;
}

export function publicPage(row) {
  if (!row) return null;
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    content: row.content,
    excerpt: row.excerpt,
    published: Boolean(row.published),
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export function navPage(row) {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export async function uniqueSlug(db, desired, ignoreId = null) {
  let slug = slugify(desired);
  for (let i = 0; i < 20; i++) {
    const candidate = i === 0 ? slug : `${slug}-${i + 1}`;
    const row = await db
      .prepare("SELECT id FROM pages WHERE slug = ?")
      .bind(candidate)
      .first();
    if (!row || row.id === ignoreId) return candidate;
  }
  return `${slug}-${crypto.randomUUID().slice(0, 8)}`;
}
