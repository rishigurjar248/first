# DealKart Combined Storefront

This version combines the **POP-inspired visual direction** with the **222 DealKart functionality**.

### Included
- POP-style dark, premium storefront appearance
- DealKart branding
- Real product images from 222
- Search across product name, brand, category, description and specs
- Category navigation
- Hover product details
- Product detail modal
- Wishlist
- Cart with quantity controls and remove
- WhatsApp direct buying
- Cart checkout on WhatsApp
- Customer name, phone, full address and pincode collection before WhatsApp
- Responsive desktop/tablet/mobile layout
- Lucide icons and Vite + React

### Setup
```bash
npm install
npm run dev
```

### Production build
```bash
npm run build
```

### WhatsApp number
Edit `WHATSAPP_NUMBER` in `src/main.jsx`. Use country code without `+`, spaces or dashes.

## Product catalog extraction
The supplied screenshot catalog has been converted into individual cropped product images and structured product records. See `PRODUCT_EXTRACTION.md`, `src/productData.js`, and `src/assets/products/`.

## 🔐 Secure Admin Authentication

Admin credentials are **not stored in the React/JSX frontend**. The admin login now uses Vercel server-side functions and an `HttpOnly` signed session cookie.

Before deploying:

1. In Vercel, open **Project → Settings → Environment Variables**.
2. Add these variables for Production (and Preview/Development if needed):
   - `ADMIN_EMAIL` — your admin email
   - `ADMIN_PASSWORD` — a new strong admin password
   - `ADMIN_SESSION_SECRET` — a long random secret (at least 32 random characters)
3. **Do not put these values in `src/`, `.env` committed to Git, or any `VITE_*` frontend variable.**
4. Redeploy after adding/changing the variables.

The repository may remain private, but the important protection is that the credentials are kept server-side. The deployed browser code contains no admin email or password.

**Important:** the old credentials that were previously hard-coded in `src/AdminPage.jsx` should be considered rotated. Set a new password in Vercel before going live.

### Local development

Create a local `.env.local` (never commit it):

```env
ADMIN_EMAIL=your-admin-email@example.com
ADMIN_PASSWORD=your-new-strong-password
ADMIN_SESSION_SECRET=replace-with-a-long-random-secret
```

The Vercel API routes are:
- `POST /api/admin-login`
- `GET /api/admin-session`
- `POST /api/admin-logout`
