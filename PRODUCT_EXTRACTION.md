# DealKart Product Extraction

The product catalog was built from the supplied `ilovepdf_pages-to-jpg.zip` screenshots.

- Individual product-gallery areas were cropped from the screenshots; whole screenshots are not used as product images.
- Product names, visible prices, ratings, brands and product attributes were transcribed from the supplied screenshots.
- Product descriptions/specs are normalized from the visible product title/image information so the DealKart UI can present useful quick details.
- Duplicate product views were consolidated (for example, the repeated Downshifter 14 listing).
- Cropped images live in `src/assets/products/` and are mapped to product records by source page in `src/productData.js`.

Run:

```bash
npm install
npm run dev
```

Then open the Vite development URL shown in the terminal.

- Added the Portronics Toad 8 Transparent Wireless Bluetooth Mouse from PDF pages 1–3. The product gallery image is cropped from the clean product-image panel on page 2; screenshot UI, title, price, and buttons are not used as the product image.
