import { pool } from './config/db.js';

const CATEGORIES = [
  { name: 'Persian',  slug: 'persian',  min: 45000, max: 350000 },
  { name: 'Kashmiri', slug: 'kashmiri', min: 35000, max: 200000 },
  { name: 'Turkish',  slug: 'turkish',  min: 25000, max: 180000 },
  { name: 'Silk',     slug: 'silk',     min: 60000, max: 400000 },
  { name: 'Woolen',   slug: 'woolen',   min: 8000,  max: 60000  },
];

const COLORS = ['Red', 'Ivory', 'Blue', 'Charcoal', 'Rust', 'Emerald', 'Gold', 'Navy'];
const SIZES = ['4x6', '6x9', '8x10'];
const BRANDS = ['Heritage Weaves', 'Royal Loom', 'Anaya Carpets', 'Silk Route Co', 'Meraki Rugs'];

const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const TOTAL = 50;

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('TRUNCATE product_images, product_variants, products, categories RESTART IDENTITY CASCADE');

    // 1. Categories
    const categoryIds = {};
    for (const cat of CATEGORIES) {
      const res = await client.query(
        `INSERT INTO categories (name, slug) VALUES ($1, $2) RETURNING id`,
        [cat.name, cat.slug]
      );
      categoryIds[cat.name] = res.rows[0].id;
    }
    console.log('✅ Inserted', CATEGORIES.length, 'categories');

    // 2. 50 products, each mapped to Carpet<i>.jpeg
    let created = 0;
    for (let i = 1; i <= TOTAL; i++) {
      // cycle through categories evenly
      const cat = CATEGORIES[(i - 1) % CATEGORIES.length];
      const color = pick(COLORS);
      const brand = pick(BRANDS);
      const basePrice = randInt(cat.min, cat.max);
      const name = `${cat.name} ${color} Carpet #${i}`;
      const slug = slugify(name);

      await client.query('BEGIN');
      try {
        const productRes = await client.query(
          `INSERT INTO products (category_id, name, slug, description, brand, gender, base_price)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING id`,
          [
            categoryIds[cat.name],
            name,
            slug,
            `Authentic ${cat.name.toLowerCase()} carpet in ${color.toLowerCase()}, hand-finished by ${brand}.`,
            brand,
            'unisex',
            basePrice,
          ]
        );
        const productId = productRes.rows[0].id;

        const sizeMultiplier = { '4x6': 1, '6x9': 1.8, '8x10': 2.6 };
        for (const size of SIZES) {
          const variantPrice = Math.round(basePrice * sizeMultiplier[size]);
          const sku = `${slug}-${size}`;
          const stock = randInt(0, 25);
          await client.query(
            `INSERT INTO product_variants (product_id, sku, size, color, price, stock_qty)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [productId, sku, size, color, variantPrice, stock]
          );
        }

        // one real image per product: /images/Carpet<i>.jpeg
        await client.query(
          `INSERT INTO product_images (product_id, url, alt_text, position)
           VALUES ($1, $2, $3, $4)`,
          [productId, `/images/Carpet${i}.jpeg`, `${name}`, 0]
        );

        await client.query('COMMIT');
        created++;
      } catch (err) {
        await client.query('ROLLBACK');
        console.error(`❌ Failed product #${i}:`, err.message);
      }
    }

    console.log(`✅ Seeded ${created} products with real images`);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();