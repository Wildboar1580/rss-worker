addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(req) {
  const url = new URL(req.url)

  // ✅ AUDIO PROXY (fully working)
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
  const text = await res.text()

  const clean = (str) =>
    str ? str.replace(/<!\[CDATA\[|\]\]>/g, '').trim() : ""

  const items = [...text.matchAll(/<item>([\s\S]*?)<\/item>/g)].map(match => {
    const item = match[1]

    const get = (regex) => {
      const m = item.match(regex)
      return clean(m ? m[1] : "")
    }

    const title = get(/<title>([\s\S]*?)<\/title>/)

    // ✅ FIX: use content:encoded FIRST, fallback to description
    const description =
      get(/<content:encoded>([\s\S]*?)<\/content:encoded>/) ||
      get(/<description>([\s\S]*?)<\/description>/)

    const pubDate = get(/<pubDate>([\s\S]*?)<\/pubDate>/)

    // ✅ FIX: enclosure extraction
    const audioMatch = item.match(/<enclosure[^>]+url="([^"]+)"/)
    const audio = audioMatch ? audioMatch[1] : ""

    // ✅ FIX: thumbnail fallback options
    const thumbnail =
      get(/itunes:image[^>]+href="([^"]+)"/) ||
      get(/media:thumbnail[^>]+url="([^"]+)"/)

    return { title, description, audio, pubDate, thumbnail }
  })

  return new Response(JSON.stringify({ items }), {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    }
  })
}
