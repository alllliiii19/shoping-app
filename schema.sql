-- Shopping app schema (PostgreSQL)
-- Run with: psql -U <user> -d shopdb -f schema.sql

CREATE TYPE order_status AS ENUM ('pending', 'paid', 'shipped', 'delivered', 'cancelled');
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'failed', 'refunded');
CREATE TYPE product_gender AS ENUM ('men', 'women', 'unisex');

-- ── Users & auth ──────────────────────────────────────────────
CREATE TABLE users (
    id            SERIAL PRIMARY KEY,
    name          VARCHAR(120)  NOT NULL,
    email         VARCHAR(255)  NOT NULL UNIQUE,
    password_hash VARCHAR(255)  NOT NULL,
    phone         VARCHAR(20),
    created_at    TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE TABLE addresses (
    id          SERIAL PRIMARY KEY,
    user_id     INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    label       VARCHAR(50)  NOT NULL,           -- "Home", "Work"
    line1       VARCHAR(255) NOT NULL,
    line2       VARCHAR(255),
    city        VARCHAR(100) NOT NULL,
    state       VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20)  NOT NULL,
    country     VARCHAR(100) NOT NULL DEFAULT 'India',
    is_default  BOOLEAN      NOT NULL DEFAULT false
);

-- ── Catalog ───────────────────────────────────────────────────
CREATE TABLE categories (
    id        SERIAL PRIMARY KEY,
    name      VARCHAR(100) NOT NULL,
    slug      VARCHAR(120) NOT NULL UNIQUE,
    parent_id INT REFERENCES categories(id) ON DELETE SET NULL
);

CREATE TABLE products (
    id          SERIAL PRIMARY KEY,
    category_id INT NOT NULL REFERENCES categories(id),
    name        VARCHAR(200) NOT NULL,
    slug        VARCHAR(220) NOT NULL UNIQUE,
    description TEXT,
    brand       VARCHAR(100),
    gender      product_gender NOT NULL DEFAULT 'unisex',
    base_price  NUMERIC(10,2) NOT NULL,
    is_active   BOOLEAN NOT NULL DEFAULT true,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_products_category ON products(category_id);

-- One row per size/color combination that can actually be bought
CREATE TABLE product_variants (
    id         SERIAL PRIMARY KEY,
    product_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    sku        VARCHAR(64) NOT NULL UNIQUE,
    size       VARCHAR(20) NOT NULL,             -- "S","M","L","42"...
    color      VARCHAR(50) NOT NULL,
    price      NUMERIC(10,2),                    -- overrides base_price if set
    stock_qty  INT NOT NULL DEFAULT 0,
    UNIQUE(product_id, size, color)
);

CREATE TABLE product_images (
    id         SERIAL PRIMARY KEY,
    product_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    variant_id INT REFERENCES product_variants(id) ON DELETE CASCADE,
    url        VARCHAR(500) NOT NULL,
    alt_text   VARCHAR(200),
    position   INT NOT NULL DEFAULT 0
);
CREATE INDEX idx_images_product ON product_images(product_id);

-- ── Cart & wishlist ──────────────────────────────────────────
CREATE TABLE cart_items (
    id         SERIAL PRIMARY KEY,
    user_id    INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    variant_id INT NOT NULL REFERENCES product_variants(id),
    quantity   INT NOT NULL CHECK (quantity > 0),
    added_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id, variant_id)
);

CREATE TABLE wishlist_items (
    id         SERIAL PRIMARY KEY,
    user_id    INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    added_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id, product_id)
);

-- ── Orders ───────────────────────────────────────────────────
CREATE TABLE orders (
    id             SERIAL PRIMARY KEY,
    user_id        INT NOT NULL REFERENCES users(id),
    address_id     INT NOT NULL REFERENCES addresses(id),
    status         order_status   NOT NULL DEFAULT 'pending',
    payment_status payment_status NOT NULL DEFAULT 'pending',
    subtotal       NUMERIC(10,2) NOT NULL,
    shipping_fee   NUMERIC(10,2) NOT NULL DEFAULT 0,
    total          NUMERIC(10,2) NOT NULL,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE order_items (
    id                SERIAL PRIMARY KEY,
    order_id          INT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    variant_id        INT NOT NULL REFERENCES product_variants(id),
    quantity          INT NOT NULL CHECK (quantity > 0),
    price_at_purchase NUMERIC(10,2) NOT NULL   -- snapshot, protects history if price changes later
);
CREATE INDEX idx_order_items_order ON order_items(order_id);

-- ── Reviews ──────────────────────────────────────────────────
CREATE TABLE reviews (
    id         SERIAL PRIMARY KEY,
    product_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    user_id    INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating     SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment    TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(product_id, user_id)
);
CREATE INDEX idx_reviews_product ON reviews(product_id);
