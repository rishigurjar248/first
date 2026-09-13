import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Download, ImagePlus, LogOut, Plus, Save, ShieldCheck, Trash2, Upload, X } from "lucide-react";
import { getInitialCatalog, fetchRemoteCatalog, saveCatalog } from "./catalogStore";

async function checkAdminSession() {
  try {
    const res = await fetch("/api/admin-session", { credentials: "include" });
    return res.ok;
  } catch {
    return false;
  }
}

const blank = () => ({
  id: Date.now(),
  page: Date.now(),
  name: "",
  brand: "",
  category: "All Deals",
  price: "",
  mrp: "",
  discount: "",
  rating: "4.3",
  reviews: "0",
  image: "",
  galleryImages: [],
  description: "",
  keyPoints: ["", "", "", ""],
  specs: ["", "", "", ""],
  isTop10: false,
});

const csvEscape = (v) => `"${String(v ?? "").replaceAll('"', '""')}"`;

function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: email.trim(), password }),
      });
      if (!res.ok) throw new Error("Invalid credentials");
      onLogin();
    } catch {
      setError("Incorrect email or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login">
      <form className="admin-login-card" onSubmit={submit}>
        <div className="admin-login-icon"><ShieldCheck size={28}/></div>
        <span className="kicker">DEALKART ADMIN</span>
        <h1>Admin access</h1>
        <p>Sign in to add, edit, remove and feature products.</p>
        <label>Email<input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Admin email" autoComplete="username" required /></label>
        <label>Password<input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" autoComplete="current-password" required /></label>
        {error && <div className="admin-error">{error}</div>}
        <button className="admin-btn primary admin-login-submit" type="submit" disabled={loading}>{loading ? "Signing in…" : "Sign in"}</button>
        <button type="button" className="admin-back" onClick={() => { window.location.hash = "top"; }}>← Back to website</button>
      </form>
    </div>
  );
}

function ImageManager({ product, update }) {
  const addImages = (files) => {
    const selected = Array.from(files || []).filter(f => f.type.startsWith("image/"));
    if (!selected.length) return;
    let remaining = selected.length;
    const urls = [];
    selected.forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        urls.push(reader.result);
        remaining -= 1;
        if (!remaining) {
          const all = [product.image, ...(product.galleryImages || []), ...urls].filter(Boolean);
          update(product.id, "image", all[0] || "");
          update(product.id, "galleryImages", [...new Set(all)]);
        }
      };
      reader.readAsDataURL(file);
    });
  };
  const removeImage = (url) => {
    const all = [product.image, ...(product.galleryImages || [])].filter(Boolean).filter(x => x !== url);
    update(product.id, "image", all[0] || "");
    update(product.id, "galleryImages", all.slice(1));
  };
  const images = [product.image, ...(product.galleryImages || [])].filter(Boolean);

  return (
    <div className="admin-images">
      <label className="admin-upload-images">
        <ImagePlus size={17}/> Add multiple images
        <input type="file" accept="image/*" multiple onChange={e => { addImages(e.target.files); e.target.value = ""; }} />
      </label>
      <div className="admin-image-list">
        {images.map((url, i) => (
          <div className="admin-image-thumb" key={`${url}-${i}`}>
            <img src={url} alt="" />
            <button type="button" onClick={() => removeImage(url)} aria-label="Remove image"><X size={13}/></button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [items, setItems] = useState(() => getInitialCatalog());
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (authenticated) {
      fetchRemoteCatalog(getInitialCatalog()).then(setItems).finally(() => setLoadingCatalog(false));
      setCheckingSession(false);
      return;
    }
    checkAdminSession().then(ok => {
      if (ok) {
        setAuthenticated(true);
      }
      setCheckingSession(false);
    });
  }, [authenticated]);
  const [query, setQuery] = useState("");

  const visible = useMemo(() => {
    const q = query.toLowerCase().trim();
    return q ? items.filter(p => `${p.name} ${p.brand} ${p.category}`.toLowerCase().includes(q)) : items;
  }, [items, query]);

  const update = (id, key, value) =>
    setItems(rows => rows.map(p => p.id === id ? { ...p, [key]: value } : p));

  const updatePoint = (id, index, value) =>
    setItems(rows => rows.map(p => p.id === id ? { ...p, keyPoints: [...(p.keyPoints || ["","","",""]),].slice(0,4).map((x,i) => i === index ? value : x) } : p));

  const add = () => setItems(rows => [...rows, blank()]);
  const remove = (id) => setItems(rows => rows.filter(p => p.id !== id));

  const toggleTop10 = (id) => {
    setItems(rows => {
      const current = rows.find(p => p.id === id);
      if (!current) return rows;
      if (!current.isTop10) {
        const count = rows.filter(p => p.isTop10).length;
        if (count >= 10) {
          alert("Top 10 Today Deals already has 10 products. Remove one before adding another.");
          return rows;
        }
      }
      return rows.map(p => p.id === id ? { ...p, isTop10: !p.isTop10 } : p);
    });
  };

  const save = () => {
    const cleaned = items.map((p, i) => {
      const points = [...(p.keyPoints || p.specs || [])].slice(0,4);
      while (points.length < 4) points.push("");
      const images = [p.image, ...(p.galleryImages || [])].filter(Boolean);
      return {
        ...p,
        id: Number(p.id) || i + 1,
        page: Number(p.page) || Number(p.id) || i + 1,
        price: Number(p.price) || 0,
        mrp: Number(p.mrp) || Number(p.oldPrice) || Number(p.price) || 0,
        oldPrice: Number(p.mrp) || Number(p.oldPrice) || Number(p.price) || 0,
        discount: Number(p.discount) || 0,
        rating: Number(p.rating) || 4.3,
        reviews: String(p.reviews || "0"),
        keyPoints: points,
        specs: points,
        image: images[0] || "",
        galleryImages: images.slice(1),
        isTop10: Boolean(p.isTop10),
      };
    });
    saveCatalog(cleaned).then(() => {
      setItems(cleaned);
      setSaved(true);
      setTimeout(() => setSaved(false), 2200);
    }).catch((error) => alert(`Could not save globally: ${error.message}`));
  };

  const exportCsv = () => {
    const cols = ["id","name","brand","category","price","mrp","discount","rating","reviews","image","description","keyPoints","isTop10"];
    const csv = [cols, ...items.map(p => cols.map(c => Array.isArray(p[c]) ? p[c].join(" | ") : p[c]))]
      .map(r => r.map(csvEscape).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "dealkart-products.csv"; a.click(); URL.revokeObjectURL(a.href);
  };

  const logout = async () => {
    try { await fetch("/api/admin-logout", { method: "POST", credentials: "include" }); } catch {}
    setAuthenticated(false);
  };

  if (checkingSession) return <div className="admin-login"><div className="admin-login-card"><span className="kicker">DEALKART ADMIN</span><h1>Checking access…</h1></div></div>;
  if (!authenticated) return <Login onLogin={() => setAuthenticated(true)} />;

  return (
    <div className="admin-page">
      <div className="admin-head">
        <div>
          <button className="admin-back" onClick={() => { window.location.hash = "top"; }}> <ArrowLeft size={16}/> Website</button>
          <span className="kicker">DEALKART CATALOG</span>
          <h1>Product Manager</h1>
          <p>Add, edit or remove products. Changes are saved to the global database and reflected on the storefront.</p>
        </div>
        <div className="admin-actions">
          <button className="admin-btn secondary" onClick={logout}><LogOut size={16}/> Log out</button>
          <button className="admin-btn secondary" onClick={exportCsv}><Download size={16}/> Export CSV</button>
          <button className="admin-btn primary" onClick={save}><Save size={16}/> {saved ? "Saved!" : "Save catalog"}</button>
        </div>
      </div>

      <div className="admin-toolbar">
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search products, brand or category…" />
        <span>{items.length} items · {items.filter(p => p.isTop10).length}/10 top deals</span>
        <button className="admin-btn primary" onClick={add}><Plus size={16}/> Add product</button>
      </div>

      <div className="admin-cards">
        {visible.map((p, rowIndex) => (
          <section className={`admin-product-card ${p.isTop10 ? "featured" : ""}`} key={p.id}>
            <div className="admin-product-title">
              <div><span className="admin-row-number">#{rowIndex + 1}</span><h2>{p.name || "New product"}</h2></div>
              <button className="delete-row" title="Remove product" onClick={() => remove(p.id)}><Trash2 size={17}/></button>
            </div>
            <div className="admin-form-grid">
              <label>Product name<input value={p.name || ""} onChange={e => update(p.id,"name",e.target.value)} /></label>
              <label>Brand<input value={p.brand || ""} onChange={e => update(p.id,"brand",e.target.value)} /></label>
              <label>Category<input value={p.category || ""} onChange={e => update(p.id,"category",e.target.value)} /></label>
              <label>MRP<input type="number" value={p.mrp ?? ""} onChange={e => update(p.id,"mrp",e.target.value)} /></label>
              <label>My price<input type="number" value={p.price ?? ""} onChange={e => update(p.id,"price",e.target.value)} /></label>
              <label>Rating<input type="number" min="0" max="5" step="0.1" value={p.rating ?? ""} onChange={e => update(p.id,"rating",e.target.value)} /></label>
              <label>Reviews<input value={p.reviews ?? ""} onChange={e => update(p.id,"reviews",e.target.value)} /></label>
              <label className="admin-top-toggle"><span>Today's Top 10</span><button type="button" className={p.isTop10 ? "on" : ""} onClick={() => toggleTop10(p.id)}>{p.isTop10 ? "✓ Added to Top 10" : "Add to Top 10"}</button></label>
              <label className="admin-wide">Description<textarea value={p.description || ""} onChange={e => update(p.id,"description",e.target.value)} /></label>
              <div className="admin-wide"><div className="admin-field-title">4 Key points</div><div className="admin-points">{[0,1,2,3].map(i => <input key={i} placeholder={`Key point ${i+1}`} value={(p.keyPoints || p.specs || [])[i] || ""} onChange={e => updatePoint(p.id,i,e.target.value)} />)}</div></div>
              <div className="admin-wide"><div className="admin-field-title">Product images</div><ImageManager product={p} update={update}/></div>
            </div>
          </section>
        ))}
      </div>
      {!visible.length && <div className="admin-empty">No products match your search.</div>}
      <div className="admin-note"><b>Tip:</b> Use Save catalog after changes. A maximum of 10 products can be marked for Today's Top 10.</div>
    </div>
  );
}
