import { NextResponse } from "next/server";
import { fetchAmazonProduct } from "@/lib/amazon";

export async function POST(req: Request) {
  const { url } = await req.json();

  try {
    const product = await fetchAmazonProduct(url);
    return NextResponse.json(product);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
