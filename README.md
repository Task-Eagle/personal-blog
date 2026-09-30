# Field Notes — personal blog on Cloudflare Pages + D1

A small blog you can keep updating from the browser.

- Public site on `your-project.pages.dev`
- Posts stored in Cloudflare D1
- Admin page with a Markdown editor
- Header navigation built from the database
- Drafts, delete, unique ids, and pretty URLs like `/p/hello`

You do **not** redeploy the site when you write a new post. Saving in Admin writes to the database, and the public site reads it.

GitHub repo: https://github.com/Task-Eagle/personal-blog

## Auto-deploy from GitHub

1. Open https://dash.cloudflare.com/?to=/:account/workers-and-pages
2. Create → Pages → Connect to Git
3. Authorize GitHub if asked, then pick `personal-blog`
4. Build settings:
   - Framework preset: None
   - Build command: leave empty
   - Build output directory: `public`
   - Root directory: `/`
5. Deploy. You get a URL like `https://personal-blog.pages.dev`
6. Settings → Bindings → Add → D1 database
   - Variable name: `DB`
   - Database: `personal-blog`
7. Settings → Variables and Secrets:
   - `ADMIN_PASSWORD` (secret)
   - `AUTH_SECRET` (secret)
8. Redeploy once so the binding and secrets apply.

After that, every push to `main` updates the live site. New posts still go through `/admin.html` and D1 — those do not need a git push.

## Create the database (once)

```bash
npx wrangler login
npx wrangler d1 create personal-blog
npx wrangler d1 execute personal-blog --remote --file=schema.sql
```

Paste the printed `database_id` into `wrangler.toml`.

## Local preview

```bash
cp .dev.vars.example .dev.vars
npm install
npm run dev
```

- Home: `/`
- Sample post: `/p/hello`
- Admin: `/admin.html`
