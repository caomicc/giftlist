import { NextRequest, NextResponse } from 'next/server'
import * as cheerio from 'cheerio'

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

    // Fetch the webpage with timeout using AbortController
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000) // 15 second timeout

    const response = await fetch(validUrl.toString(), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Cache-Control': 'max-age=0',
      },
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
    if (ogData.image && !ogData.image.startsWith('http')) {
      // Convert relative URLs to absolute
      try {
        ogData.image = new URL(ogData.image, validUrl.origin).toString()
      } catch (error) {
        ogData.image = null
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
