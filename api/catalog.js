import { createClient } from "@supabase/supabase-js";
import { getCookie, verifySession, COOKIE_NAME } from "../lib/auth.js";

const getDb = () => createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
);

const arrayValue = (value) => Array.isArray(value) ? value : [];

const mapRow = (r = {}) => ({
  id: Number(r.id),
  page: Number(r.page ?? r.id),
  name: r.name ?? "",
  brand: r.brand ?? "",
  category: r.category ?? "All Deals",
  price: Number(r.price ?? 0),
  mrp: Number(r.mrp ?? r.old_price ?? 0),
  oldPrice: Number(r.old_price ?? r.mrp ?? 0),
  discount: Number(r.discount ?? 0),
  rating: Number(r.rating ?? 4.3),
  reviews: String(r.reviews ?? "0"),
  reviewCount: Number(r.review_count ?? 0),
  image: r.image ?? "",
  galleryImages: arrayValue(r.gallery_images),
  images: arrayValue(r.images),
  keyPoints: arrayValue(r.key_points),
  specs: arrayValue(r.key_points),
  description: r.description ?? "",
  isTop10: Boolean(r.is_top10),
  top10Rank: r.top10_rank ?? null,
  isActive: r.is_active !== false,
});

const mapProduct = (p = {}) => {
  const galleryImages = arrayValue(p.galleryImages ?? p.gallery_images);
  const images = arrayValue(p.images);
  const keyPoints = arrayValue(p.keyPoints ?? p.key_points ?? p.specs).slice(0, 4);
  return {
    id: Number(p.id),
    page: Number(p.page ?? p.id),
    name: String(p.name ?? ""),
    brand: String(p.brand ?? ""),
    category: String(p.category ?? "All Deals"),
    price: Number(p.price ?? 0),
    mrp: Number(p.mrp ?? p.oldPrice ?? p.old_price ?? 0),
    old_price: Number(p.oldPrice ?? p.old_price ?? p.mrp ?? 0),
    discount: Number(p.discount ?? 0),
    rating: Number(p.rating ?? 4.3),
    reviews: String(p.reviews ?? "0"),
    review_count: Number(p.reviewCount ?? p.review_count ?? 0),
    image: String(p.image ?? ""),
    gallery_images: galleryImages,
    images,
    key_points: keyPoints,
    description: String(p.description ?? ""),
    is_top10: Boolean(p.isTop10 ?? p.is_top10),
    top10_rank: p.top10Rank ?? p.top10_rank ?? null,
    is_active: p.isActive !== false && p.is_active !== false,
    updated_at: new Date().toISOString(),
  };
};

export default async function handler(req, res) {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(500).json({ error: "Supabase environment variables are missing." });
  }

  const db = getDb();

  if (req.method === "GET") {
    const { data, error } = await db
      .from("products")
      .select("*")
      .eq("is_active", true)
      .order("top10_rank", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ products: (data ?? []).map(mapRow) });
  }

  if (!verifySession(getCookie(req, COOKIE_NAME))) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  if (req.method !== "PUT") return res.status(405).json({ error: "Method not allowed" });

  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  const products = Array.isArray(body?.products) ? body.products : null;
  if (!products) return res.status(400).json({ error: "products must be an array" });
  if (products.length === 0) return res.status(400).json({ error: "Catalog cannot be empty. Keep at least one product." });

  const rows = products.map(mapProduct).filter((p) => Number.isFinite(p.id) && p.id > 0);
  if (!rows.length) return res.status(400).json({ error: "No valid products were supplied." });

  // Upsert first. This prevents a failed request from hiding the entire catalog.
  const { error: upsertError } = await db.from("products").upsert(rows, { onConflict: "id" });
  if (upsertError) return res.status(500).json({ error: upsertError.message });

  const ids = rows.map((p) => p.id);
  const { error: deactivateError } = await db
    .from("products")
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("is_active", true)
    .not("id", "in", `(${ids.join(",")})`);
  if (deactivateError) return res.status(500).json({ error: deactivateError.message });

  return res.status(200).json({ ok: true, count: rows.length });
}
