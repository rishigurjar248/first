import { extractedProducts } from "./productData";

export const CATALOG_KEY = "dealkart-catalog-v2";

const normalize = (p, index = 0) => ({
  ...p,
  id: Number(p.id) || index + 1,
  page: Number(p.page) || Number(p.id) || index + 1,
  name: String(p.name || p.title || "Untitled product"),
  brand: String(p.brand || "DealKart"),
  category: String(p.category || "All Deals"),
  price: Number(p.price) || 0,
  mrp: Number(p.mrp) || Number(p.oldPrice) || Number(p.price) || 0,
  oldPrice: Number(p.oldPrice) || Number(p.mrp) || Number(p.price) || 0,
  discount: Number(p.discount) || 0,
  rating: Number.isFinite(Number(p.rating)) ? Number(p.rating) : 4.3,
  reviews: p.reviews && p.reviews !== "—" ? String(p.reviews) : "128",
  image: p.image || "",
  galleryImages: Array.isArray(p.galleryImages) ? p.galleryImages.filter(Boolean) : [],
  keyPoints: Array.isArray(p.keyPoints) ? p.keyPoints.slice(0, 4) : (Array.isArray(p.specs) ? p.specs.slice(0, 4) : ["", "", "", ""]),
  isTop10: Boolean(p.isTop10),
  description: String(p.description || ""),
});

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

export function loadCatalog(fallback) { return fallback; }

export async function fetchRemoteCatalog(fallback = []) {
  try {
    const res = await fetch("/api/catalog", { cache: "no-store" });
    if (!res.ok) throw new Error("Unable to fetch catalog");
    const json = await res.json();
    return Array.isArray(json.products) && json.products.length ? json.products.map(normalize) : fallback;
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
