// Vercel Edge Middleware — rewrites social-media crawler requests for /s?id=...
// to the API endpoint that returns proper OG meta tags.

const CRAWLER_UA_RE =
  /facebookexternalhit|Facebot|Twitterbot|LinkedInBot|Slackbot|WhatsApp|TelegramBot|Discordbot|Googlebot|bingbot|Embedly|Quora Link Preview|Showyoubot|outbrain|pinterest|vkShare|W3C_Validator/i

export const config = {
  matcher: '/s',
}

export default function middleware(request) {
  const ua = request.headers.get('user-agent') || ''
  if (!CRAWLER_UA_RE.test(ua)) return

  const url = new URL(request.url)
  const shareId = url.searchParams.get('id')
  if (!shareId) return

  // Rewrite crawler requests to the share API which returns full HTML with OG tags
  const apiUrl = new URL('/api/share', request.url)
  apiUrl.searchParams.set('id', shareId)
  apiUrl.searchParams.set('og', '1')

  return Response.redirect(apiUrl.toString(), 302)
}
