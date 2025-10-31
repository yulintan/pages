// functions/api/youtube.js
// Usage: https://vanguzheng.com/api/youtube?channel=UCK_5Kn9S1xAv2WpVjVgflqQ
export async function onRequestGet(context) {
  const { request } = context;
  const url = new URL(request.url);
  const channel = url.searchParams.get("channel");
  const limit = Number(url.searchParams.get("limit") || 8);

  if (!channel) {
    return new Response(JSON.stringify({ error: "missing channel param" }), {
      status: 400,
      headers: { "content-type": "application/json; charset=utf-8" }
    });
  }

  const rss = `https://www.youtube.com/feeds/videos.xml?channel_id=${channel}`;
  const resp = await fetch(rss, { cf: { cacheTtl: 300, cacheEverything: true }});
  if (!resp.ok) {
    return new Response(JSON.stringify({ error: "fetch rss failed" }), {
      status: 502,
      headers: { "content-type": "application/json; charset=utf-8" }
    });
  }

  const xml = await resp.text();

  const items = [];
  const entries = xml.split("<entry>").slice(1);
  for (const raw of entries) {
    const get = (re) => (raw.match(re) || [,""])[1].trim();
    const videoId = get(/<yt:videoId>([^<]+)<\/yt:videoId>/);
    const title   = get(/<title>([^<]+)<\/title>/);
    const pub     = get(/<published>([^<]+)<\/published>/);

    if (!videoId) continue;
    items.push({
      videoId,
      title,
      publishedAt: pub,
      thumb: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      url: `https://www.youtube.com/watch?v=${videoId}`
    });
    if (items.length >= limit) break;
  }

  return new Response(JSON.stringify({ items }), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=300"
    }
  });
}
