import { extractedProducts } from "./productData";

export const CATALOG_KEY = "dealkart-catalog-v2";

const asArray = (value) => {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
    } catch {
      return value.trim() ? [value] : [];
    }
  }
  return [];
};

const asNumber = (value, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

export const normalize = (p = {}, index = 0) => {
  const keyPoints = asArray(p.keyPoints ?? p.key_points ?? p.specs).slice(0, 4);
  const galleryImages = asArray(p.galleryImages ?? p.gallery_images);
  const images = asArray(p.images);
  const allImages = [...new Set([...galleryImages, ...images].filter(Boolean))];
  const id = asNumber(p.id, index + 1);
  const price = asNumber(p.price, 0);
  const mrp = asNumber(p.mrp ?? p.oldPrice ?? p.old_price, price);

  return {
    ...p,
    id,
    page: asNumber(p.page, id),
    name: String(p.name ?? p.title ?? "Untitled product"),
    brand: String(p.brand ?? "DealKart"),
    category: String(p.category ?? "All Deals"),
    price,
    mrp,
    oldPrice: asNumber(p.oldPrice ?? p.old_price ?? p.mrp, mrp),
    discount: asNumber(p.discount, 0),
    rating: asNumber(p.rating, 4.3),
    reviews: p.reviews != null && String(p.reviews) !== "—" ? String(p.reviews) : "0",
    reviewCount: asNumber(p.reviewCount ?? p.review_count, 0),
    image: String(p.image ?? ""),
    galleryImages: allImages,
    images: allImages,
    keyPoints,
    specs: keyPoints,
    isTop10: Boolean(p.isTop10 ?? p.is_top10),
    top10Rank: p.top10Rank ?? p.top10_rank ?? null,
    description: String(p.description ?? ""),
    isActive: p.isActive ?? p.is_active ?? true,
  };
};

export function getInitialCatalog() {
  const productImages = import.meta.glob("./assets/products/product-*.jpg", {
    eager: true,
    import: "default",
    query: "?url",
  });
  const defaultTop10 = new Set([2, 9, 13, 19, 48, 49, 55, 76, 79, 1040]);
  return extractedProducts.map((p, index) =>
    normalize(
      {
        ...p,
        isTop10: defaultTop10.has(Number(p.page)),
        image:
          productImages[
            `./assets/products/product-${String(p.page).padStart(4, "0")}.jpg`
          ],
      },
      index,
    ),
  );
}

export function loadCatalog(fallback) {
  return fallback;
}

export async function fetchRemoteCatalog(fallback = []) {
  try {
    const res = await fetch("/api/catalog", { cache: "no-store" });
    if (!res.ok) throw new Error(`Catalog request failed (${res.status})`);
    const json = await res.json();
    if (!Array.isArray(json.products) || json.products.length === 0) return fallback;
    return json.products.map(normalize);
  } catch (error) {
    console.warn("Using bundled catalog because remote catalog could not be loaded.", error);
    return fallback;
  }
}

export async function saveCatalog(items) {
  const res = await fetch("/api/catalog", {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ products: items }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || "Unable to save catalog");
  return json;
}
