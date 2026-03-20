addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(req) {
  const url = new URL(req.url)

  // ✅ AUDIO PROXY (FIXED)
  if (url.searchParams.has('audio')) {
    const audioUrl = url.searchParams.get('audio')

    const audioRes = await fetch(audioUrl)

    return new Response(audioRes.body, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Access-Control-Allow-Origin": "*",
        "Accept-Ranges": "bytes"
      }
    })
  }

  // ✅ FETCH RSS
  const feedUrl = "https://media.rss.com/last-christian-ministries/feed.xml"
  const res = await fetch(feedUrl)
  const text = await res.text()

  // ✅ PARSE ITEMS (IMPROVED)
  const items = [...text.matchAll(/<item>([\s\S]*?)<\/item>/g)].map(match => {
    const item = match[1]

    const getTag = (tag) => {
      const m = item.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`))
      return m ? m[1].replace(/<!\[CDATA\[|\]\]>/g, '').trim() : ""
    }

    const title = getTag("title")
    const description = getTag("description")
    const pubDate = getTag("pubDate")

    const audio = (item.match(/<enclosure[^>]*url="([^"]+)"/) || [])[1] || ""

    const thumbnail =
      (item.match(/itunes:image[^>]*href="([^"]+)"/) || [])[1] ||
      ""

    return { title, description, audio, pubDate, thumbnail }
  })

  // ✅ RETURN JSON WITH CORS
  return new Response(JSON.stringify({ items }), {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    }
  })
}
