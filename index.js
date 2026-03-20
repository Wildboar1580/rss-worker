addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(req) {
  const url = new URL(req.url)

  // ✅ AUDIO PROXY (WORKING)
  if (url.searchParams.has('audio')) {
    const audioUrl = url.searchParams.get('audio')
    const audioRes = await fetch(audioUrl)

    return new Response(audioRes.body, {
      headers: {
        "Content-Type": audioRes.headers.get("Content-Type") || "audio/mpeg",
        "Access-Control-Allow-Origin": "*",
        "Accept-Ranges": "bytes"
      }
    })
  }

  const feedUrl = "https://media.rss.com/last-christian-ministries/feed.xml"
  const res = await fetch(feedUrl)
  const xml = await res.text()

  const clean = (str) =>
    str ? str.replace(/<!\[CDATA\[|\]\]>/g, '').trim() : ""

  const getTag = (text, tag) => {
    const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i")
    const match = text.match(regex)
    return clean(match ? match[1] : "")
  }

  const getAttr = (text, tag, attr) => {
    const regex = new RegExp(`<${tag}[^>]*${attr}="([^"]+)"`, "i")
    const match = text.match(regex)
    return match ? match[1] : ""
  }

  const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)].map(match => {
    const item = match[1]

    const title = getTag(item, "title")

    // Try multiple description sources
    const description =
      getTag(item, "content:encoded") ||
      getTag(item, "description") ||
      "No description available."

    const pubDate = getTag(item, "pubDate")

    // Reliable enclosure extraction
    const audio = getAttr(item, "enclosure", "url")

    // Thumbnail fallbacks
    const thumbnail =
      getAttr(item, "itunes:image", "href") ||
      getAttr(item, "media:thumbnail", "url") ||
      ""

    return { title, description, audio, pubDate, thumbnail }
  })

  return new Response(JSON.stringify({ items }), {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    }
  })
}
