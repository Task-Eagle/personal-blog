export async function onRequestGet(context) {
  const slug = context.params.slug;
  if (!slug) {
    return Response.redirect(new URL("/", context.request.url), 302);
  }

  const dest = new URL("/post.html", context.request.url);
  dest.searchParams.set("slug", slug);
  dest.searchParams.set("id", slug);

  if (context.env.ASSETS) {
    return context.env.ASSETS.fetch(dest);
  }

  return Response.redirect(dest, 302);
}
