import { createClient } from '@supabase/supabase-js';
import { getCookie, verifySession, COOKIE_NAME } from '../lib/auth.js';

const supabase = () => createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const mapRow = (r) => ({ ...r, oldPrice: r.old_price, galleryImages: r.gallery_images || [], keyPoints: r.key_points || [], isTop10: r.is_top10, reviewCount: r.review_count });
const mapProduct = (p) => ({ id: Number(p.id), page: Number(p.page || p.id), name: p.name || '', brand: p.brand || '', category: p.category || 'All Deals', price: Number(p.price || 0), mrp: Number(p.mrp || p.oldPrice || 0), old_price: Number(p.oldPrice || p.mrp || 0), discount: Number(p.discount || 0), rating: Number(p.rating || 4.3), reviews: String(p.reviews || '0'), review_count: Number(p.reviewCount || 0), image: p.image || '', gallery_images: p.galleryImages || [], images: p.images || [], key_points: p.keyPoints || p.specs || [], description: p.description || '', is_top10: Boolean(p.isTop10), top10_rank: p.top10Rank ?? null, is_active: p.isActive !== false });

export default async function handler(req, res) {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return res.status(500).json({ error: 'Supabase environment variables are missing.' });
  const db = supabase();
  if (req.method === 'GET') {
    const { data, error } = await db.from('products').select('*').eq('is_active', true).order('top10_rank', { ascending: true, nullsFirst: false }).order('created_at', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ products: (data || []).map(mapRow) });
  }
  if (!verifySession(getCookie(req, COOKIE_NAME))) return res.status(401).json({ error: 'Unauthorized' });
  if (req.method !== 'PUT') return res.status(405).json({ error: 'Method not allowed' });
  let body = req.body; if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
  const products = Array.isArray(body?.products) ? body.products : [];
  const { error: deleteError } = await db.from('products').update({ is_active: false, updated_at: new Date().toISOString() }).eq('is_active', true);
  if (deleteError) return res.status(500).json({ error: deleteError.message });
  const rows = products.map(mapProduct);
  if (rows.length) { const { error } = await db.from('products').upsert(rows, { onConflict: 'id' }); if (error) return res.status(500).json({ error: error.message }); }
  return res.status(200).json({ ok: true, count: rows.length });
}
