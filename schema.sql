-- Run once against your D1 database:
--   npx wrangler d1 execute personal-blog --remote --file=schema.sql
--   npx wrangler d1 execute personal-blog --local  --file=schema.sql

CREATE TABLE IF NOT EXISTS pages (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT NOT NULL DEFAULT '',
  published INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_pages_published_created
  ON pages (published, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_pages_slug
  ON pages (slug);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

INSERT OR IGNORE INTO settings (key, value) VALUES
  ('site_name', 'Field Notes'),
  ('tagline', 'A small personal blog.');

INSERT OR IGNORE INTO pages (
  id, slug, title, content, excerpt, published, created_at, updated_at
) VALUES (
  'welcome-001',
  'hello',
  'Hello, this is the first post',
  '# Hello

This post was created automatically so the blog is not empty when you first deploy it.

## What you can do

- Open **Admin** in the header
- Sign in with the password you set as `ADMIN_PASSWORD`
- Write a new post in Markdown
- Save it, then it shows up in the header and on the home page
- Edit or delete any post later

## Markdown examples

You can use **bold**, *italic*, `code`, and lists:

1. First
2. Second
3. Third

> Short quotes work too.

Links look like [this](/).

When you are ready, delete this post from the admin panel and write your own.
',
  'This post was created automatically so the blog is not empty when you first deploy it.',
  1,
  '2026-09-30T00:00:00.000Z',
  '2026-09-30T00:00:00.000Z'
);
