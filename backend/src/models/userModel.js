import { pool } from '../config/db.js';

// Create a new user, return the safe (non-secret) fields
export async function createUser({ name, email, passwordHash, phone }) {
  const result = await pool.query(
    `INSERT INTO users (name, email, password_hash, phone)
     VALUES ($1, $2, $3, $4)
     RETURNING id, name, email, phone, created_at`,
    [name, email, passwordHash, phone]
  );
  return result.rows[0];
}

// Find one user by email, return ALL fields including password_hash
export async function findUserByEmail(email) {
  const result = await pool.query(
    `SELECT * FROM users WHERE email = $1`,
    [email]
  );
  return result.rows[0];
}

export async function findUserById(id) {
  const result = await pool.query(
    `SELECT id, name, email, phone, created_at FROM users WHERE id = $1`,
    [id]
  );
  return result.rows[0];
}