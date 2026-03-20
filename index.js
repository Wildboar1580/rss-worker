addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(req) {
  const url = new URL(req.url)

  // Audio proxy
  if (url.searchParams.has('audio')) {
    const audioUrl = url.searchParams.get('audio')
    return fetch(audioUrl, { headers: { 'Origin': url.origin } })
  }

  // RSS feed
  const feedUrl = "https://media.rss.com/last-christian-ministries/feed.xml"
  let text
  try {
    const res = await fetch(feedUrl)
    text = await res.text()
  } catch (err) {
    return new Response(JSON.stringify({ items: [] }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    })
  }

  // Parse <item> blocks
  const items = [...text.matchAll(/<item>([\s\S]*?)<\/item>/g)].map(match => {
    const itemText = match[1]
    const title = (itemText.match(/<title>([\s\S]*?)<\/title>/)?.[1] || "").trim()
    const description = (itemText.match(/<description>([\s\S]*?)<\/description>/)?.[1] || "").trim()
    const audio = (itemText.match(/<enclosure url="([\s\S]*?)"/)?.[1] || "").trim()
    const pubDate = (itemText.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1] || "").trim()
    const thumbnail = (itemText.match(/<itunes:image href="([\s\S]*?)"/)?.[1] || "").trim()
    return { title, description, audio, pubDate, thumbnail }
  })

  // Return JSON with CORS
  return new Response(JSON.stringify({ items }), {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"   // Allows Google Sites
    }
  })
}
