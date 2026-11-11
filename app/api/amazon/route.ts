import { getApiUser } from '@/lib/auth'
import { unauthorized } from '@/lib/gift-privacy'
import { NextResponse } from "next/server";
import { fetchAmazonProduct } from "@/lib/amazon";

export async function POST(req: Request) {
  const currentUser = await getApiUser()
  if (!currentUser) return unauthorized()

  const { url } = await req.json();

  try {
    const product = await fetchAmazonProduct(url);
    return NextResponse.json(product);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
