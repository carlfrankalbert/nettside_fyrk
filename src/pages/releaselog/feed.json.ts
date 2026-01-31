import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

export const GET: APIRoute = async () => {
  const posts = (await getCollection('releaselog', ({ data }) => !data.draft))
    .sort((a, b) => b.data.date.getTime() - a.data.date.getTime())
    .slice(0, 50);

  const feed = posts.map((post) => ({
    title: post.data.title,
    date: post.data.date.toISOString(),
    summary: post.data.summary,
    slug: post.slug,
    tags: post.data.tags ?? [],
  }));

  return new Response(JSON.stringify(feed), {
    headers: { 'Content-Type': 'application/json' },
  });
};
