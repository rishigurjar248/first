import { createClient } from "@supabase/supabase-js";
import { extractedProducts } from "./productData";

export const CATALOG_KEY = "dealkart-catalog-v2";
export const supabase = import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY
  ? createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY) : null;

const normalize = (p, index = 0) => ({ ...p, id: Number(p.id) || index + 1, page: Number(p.page) || Number(p.id) || index + 1, name: String(p.name || p.title || "Untitled product"), brand: String(p.brand || "DealKart"), category: String(p.category || "All Deals"), price: Number(p.price) || 0, mrp: Number(p.mrp) || Number(p.oldPrice) || Number(p.price) || 0, oldPrice: Number(p.oldPrice) || Number(p.mrp) || Number(p.price) || 0, discount: Number(p.discount) || 0, rating: Number.isFinite(Number(p.rating)) ? Number(p.rating) : 4.3, reviews: p.reviews && p.reviews !== "—" ? String(p.reviews) : "128", review_count: Number(p.review_count) || Number(p.reviews) || 0, image: p.image || "", galleryImages: Array.isArray(p.galleryImages) ? p.galleryImages.filter(Boolean) : (Array.isArray(p.images) ? p.images.slice(1) : []), images: Array.isArray(p.images) ? p.images.filter(Boolean) : [p.image, ...(p.galleryImages || [])].filter(Boolean), keyPoints: Array.isArray(p.keyPoints) ? p.keyPoints.slice(0, 4) : (Array.isArray(p.key_points) ? p.key_points.slice(0, 4) : ["", "", "", ""]), isTop10: Boolean(p.isTop10 ?? p.is_top10), top10_rank: Number(p.top10_rank) || 999, description: String(p.description || ""), is_active: p.is_active !== false });

export function getInitialCatalog() {
  const productImages = import.meta.glob("./assets/products/product-*.jpg", { eager: true, import: "default", query: "?url" });
  const defaultTop10 = new Set([2, 9, 13, 19, 48, 49, 55, 76, 79, 1040]);
  return extractedProducts.map((p, index) => normalize({ ...p, isTop10: defaultTop10.has(Number(p.page)), image: productImages[`./assets/products/product-${String(p.page).padStart(4, "0")}.jpg`] }, index));
}
export function loadCatalog(fallback) { try { const saved = JSON.parse(localStorage.getItem(CATALOG_KEY) || "null"); if (Array.isArray(saved) && saved.length) return saved.map(normalize); } catch {} return fallback; }
export function saveCatalog(items) { try { localStorage.setItem(CATALOG_KEY, JSON.stringify(items)); } catch {} }
export async function fetchCatalog(fallback = getInitialCatalog()) {
  if (!supabase) return loadCatalog(fallback);
  const { data, error } = await supabase.from("catalog_products").select("*").eq("is_active", true).order("top10_rank", { ascending: true });
  if (error || !data?.length) return loadCatalog(fallback);
  return data.map(normalize);
}
export async function upsertCatalog(items) {
  if (!supabase) throw new Error("Supabase environment variables are missing.");
  const rows = items.map((p, i) => { const images = [p.image, ...(p.galleryImages || [])].filter(Boolean); return { id: Number(p.id) || i + 1, page: Number(p.page) || Number(p.id) || i + 1, name: p.name, brand: p.brand, category: p.category, price: Number(p.price) || 0, mrp: Number(p.mrp) || 0, old_price: Number(p.mrp) || 0, discount: Number(p.discount) || 0, rating: Number(p.rating) || 0, reviews: String(p.reviews || p.review_count || 0), review_count: Number(p.review_count) || 0, image: images[0] || "", gallery_images: images.slice(1), images, key_points: p.keyPoints || [], description: p.description || "", is_top10: Boolean(p.isTop10), top10_rank: Number(p.top10_rank) || 999, is_active: p.is_active !== false }; });
  const { data, error } = await supabase.from("catalog_products").upsert(rows, { onConflict: "id" }).select();
  if (error) throw error; return data.map(normalize);
}
export async function uploadProductImages(files, productId) {
  if (!supabase) throw new Error("Supabase environment variables are missing.");
  const urls = [];
  for (const file of Array.from(files || [])) { const path = `${productId}/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`; const { error } = await supabase.storage.from("product-images").upload(path, file, { upsert: false, contentType: file.type }); if (error) throw error; const { data } = supabase.storage.from("product-images").getPublicUrl(path); urls.push(data.publicUrl); }
  return urls;
}
