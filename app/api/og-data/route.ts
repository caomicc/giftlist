import { NextRequest, NextResponse } from 'next/server'
import * as cheerio from 'cheerio'

// Helper function to extract basic info from URLs when direct fetching fails
function extractBasicDataFromUrl(url: URL) {
  const hostname = url.hostname.toLowerCase()
  const pathname = url.pathname

  // Extract potential title from URL path
  let title = null
  if (pathname.includes('/listing/')) {
    // Etsy-style URLs
    const pathParts = pathname.split('/')
    const listingIndex = pathParts.findIndex(part => part === 'listing')
    if (listingIndex !== -1 && pathParts[listingIndex + 2]) {
      title = pathParts[listingIndex + 2]
        .replace(/-/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase())
    }
  } else if (pathname.includes('/dp/') || pathname.includes('/product/')) {
    // Amazon-style URLs
    title = 'Product from ' + hostname.replace('www.', '')
  }

  if (title) {
    return {
      title: title.substring(0, 100), // Limit length
      description: `Product from ${hostname.replace('www.', '')}`,
      image: null,
      siteName: hostname.replace('www.', ''),
      type: 'product',
      url: url.toString(),
      price: null,
    }
  }

  return null
}

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      )
    }

    // Validate URL format
    let validUrl: URL
    try {
      validUrl = new URL(url)
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      )
    }

    // Check if this is a known problematic domain
    const hostname = validUrl.hostname.toLowerCase()
    const isBlockedDomain = [
      'amazon.com',
      'amazon.co.uk',
      'amazon.ca',
      'etsy.com'
    ].some(domain => hostname.includes(domain))

    if (isBlockedDomain) {
      // For blocked domains, try to extract basic info from URL
      const basicData = extractBasicDataFromUrl(validUrl)
      if (basicData) {
        return NextResponse.json({ ogData: basicData })
      }
    }

    // Fetch the webpage with timeout using AbortController
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000) // 15 second timeout

    // Try different approaches based on the domain
    const isEtsy = validUrl.hostname.includes('etsy.com')
    const isAmazon = validUrl.hostname.includes('amazon.com')

    let headers: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
      'Sec-Ch-Ua-Mobile': '?0',
      'Sec-Ch-Ua-Platform': '"macOS"',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'Upgrade-Insecure-Requests': '1',
    }

    // Special handling for Etsy
    if (isEtsy) {
      headers = {
        ...headers,
        'User-Agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
        'Accept': '*/*',
      }
    }

    const response = await fetch(validUrl.toString(), {
      headers,
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const html = await response.text()
    const $ = cheerio.load(html)

    // Extract OpenGraph and meta data using cheerio
    const getMetaContent = (property: string, attribute: 'property' | 'name' = 'property') => {
      return $(`meta[${attribute}="${property}"]`).attr('content') || null
    }

    const ogData = {
      title: getMetaContent('og:title') ||
        getMetaContent('title', 'name') ||
        $('title').text() ||
        null,
      description: getMetaContent('og:description') ||
        getMetaContent('description', 'name') ||
        null,
      image: getMetaContent('og:image') ||
        getMetaContent('twitter:image') ||
        getMetaContent('twitter:image:src') ||
        null,
      siteName: getMetaContent('og:site_name') ||
        validUrl.hostname ||
        null,
      type: getMetaContent('og:type') || 'website',
      url: getMetaContent('og:url') || url,
      price: getMetaContent('product:price:amount') ||
        getMetaContent('price') ||
        null,
    }

    // Clean up the data
    if (ogData.title) {
      ogData.title = ogData.title.trim().substring(0, 200) // Limit title length
    }
    if (ogData.description) {
      ogData.description = ogData.description.trim().substring(0, 500) // Limit description length
    }
    if (ogData.image) {
      if (!ogData.image.startsWith('http')) {
        // Convert relative URLs to absolute
        try {
          ogData.image = new URL(ogData.image, validUrl.origin).toString()
        } catch (error) {
          ogData.image = null
        }
      }
      // Ensure HTTPS for security (convert HTTP to HTTPS)
      if (ogData.image && ogData.image.startsWith('http://')) {
        ogData.image = ogData.image.replace('http://', 'https://')
      }
    }

    return NextResponse.json({ ogData })
  } catch (error) {
    console.error('Failed to fetch OG data:', error)

    // Provide more detailed error information
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return NextResponse.json(
          { error: 'Request timeout - website took too long to respond' },
          { status: 408 }
        )
      }
      if (error.message.includes('HTTP error')) {
        return NextResponse.json(
          { error: `Website returned an error: ${error.message}` },
          { status: 502 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Failed to fetch webpage data' },
      { status: 500 }
    )
  }
}
