import { pool } from '../config/db.js';

export async function listProducts(filters) {
  const { category, minPrice, maxPrice, gender, search, sort } = filters;

  const conditions = ['is_active = true'];   // always only show active products
  const values = [];
  let i = 1;                                  // tracks the $N placeholder number

  if (category) {
    conditions.push(`category_id = (SELECT id FROM categories WHERE slug = $${i})`);
    values.push(category);
    i++;
  }

  if (minPrice) {
    conditions.push(`base_price >= $${i}`);
    values.push(minPrice);
    i++;
  }

  if (maxPrice) {
    conditions.push(`base_price <= $${i}`);
    values.push(maxPrice);
    i++;
  }

  if (gender) {
    conditions.push(`gender = $${i}`);
    values.push(gender);
    i++;
  }

  if (search) {
    conditions.push(`name ILIKE $${i}`);
    values.push(`%${search}%`);
    i++;
  }

  const whereClause = conditions.length
    ? `WHERE ${conditions.join(' AND ')}`
    : '';

  // Whitelist sort options — never interpolate user input directly into ORDER BY
  const sortMap = {
    newest: 'p.created_at DESC',
    price_low: 'p.base_price ASC',
    price_high: 'p.base_price DESC',
    name: 'p.name ASC',
  };
  const orderBy = sortMap[sort] || sortMap.newest;

  const query = `
    SELECT
      p.id, p.category_id, p.name, p.slug, p.brand, p.gender, p.base_price, p.created_at,
      (
        SELECT url FROM product_images
        WHERE product_id = p.id
        ORDER BY position
        LIMIT 1
      ) AS image_url
    FROM products p
    ${whereClause}
    ORDER BY ${orderBy}
    LIMIT 50
  `;

  const result = await pool.query(query, values);
  return result.rows;
}

// Get one product by id
export async function getProductById(id) {
  const result = await pool.query(
    `SELECT id, category_id, name, slug, description, brand, gender, base_price, is_active, created_at
     FROM products
     WHERE id = $1`,
    [id]
  );
  return result.rows[0];
}

// Get all variants for a product
export async function getVariantsByProductId(productId) {
  const result = await pool.query(
    `SELECT id, sku, size, color, price, stock_qty
     FROM product_variants
     WHERE product_id = $1
     ORDER BY id`,
    [productId]
  );
  return result.rows;
}

// Get all images for a product
export async function getImagesByProductId(productId) {
  const result = await pool.query(
    `SELECT id, url, alt_text, position
     FROM product_images
     WHERE product_id = $1
     ORDER BY position`,
    [productId]
  );
  return result.rows;
}