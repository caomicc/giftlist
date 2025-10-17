import { sql } from "./neon";


const RAPID_API_KEY = process.env.RAPID_API_KEY!;
const CACHE_TTL_HOURS = 24;

export async function fetchAmazonProduct(url: string) {
  const asinMatch = url.match(/\/([A-Z0-9]{10})(?:[/?]|$)/);
  const asin = asinMatch?.[1];
  if (!asin) throw new Error("Invalid Amazon URL");

  // 1️⃣ Check cache
  const result = await sql`SELECT * FROM amazon_products WHERE asin = ${asin}`;
  const product = result[0];

  if (product) {
    const ageHours = (Date.now() - new Date(product.updated_at).getTime()) / 3600000;
    if (ageHours < CACHE_TTL_HOURS) {
      return { ...product, cached: true };
    }
  }

  // 2️⃣ Fetch fresh data
  const res = await fetch(`https://amazon-api-scraping.p.rapidapi.com/api/products/${asin}?exclude_reviews=true`, {
    headers: {
      "x-rapidapi-key": RAPID_API_KEY,
      "x-rapidapi-host": "amazon-api-scraping.p.rapidapi.com",
    },
  });

  if (!res.ok) throw new Error("Amazon API request failed");
  const data = await res.json();
  if (!data || data.error) throw new Error("Product not found");

  // Debug: Log the response to see what fields we're getting
  console.log('Amazon API Response:', JSON.stringify(data, null, 2));

  // Map the API response to our schema
  const newProduct = {
    asin,
    url,
    title: data.title || data.product_title || data.name || null,
    description: data.description || data.product_description || data.about_product || data.feature_bullets?.join('\n') || null,
    image_url: data.main_image || data.product_photo || data.images?.[0] || data.product_main_image_url || null,
    price: data.pricing || data.product_price || data.price_string || null,
    currency: data.currency || data.currency_code || "USD",
    updated_at: new Date().toISOString(),
  };

  // 3️⃣ Upsert into cache
  await sql`
    INSERT INTO amazon_products (asin, url, title, description, image_url, price, currency, updated_at)
    VALUES (${newProduct.asin}, ${newProduct.url}, ${newProduct.title}, ${newProduct.description}, ${newProduct.image_url}, ${newProduct.price}, ${newProduct.currency}, ${newProduct.updated_at})
    ON CONFLICT (asin) DO UPDATE SET
      title = EXCLUDED.title,
      description = EXCLUDED.description,
      image_url = EXCLUDED.image_url,
      price = EXCLUDED.price,
      currency = EXCLUDED.currency,
      updated_at = EXCLUDED.updated_at
  `;

  return { ...newProduct, cached: false };
}
