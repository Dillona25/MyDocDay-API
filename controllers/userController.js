import pool from "../db/index.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { BadRequestError, ConflictError, InternalServerError } from "../errors/errors.js";

export const createUser = async (req, res) => {
  const { first_name, last_name, email, phone, password } = req.body;

  if (!first_name || !last_name || !email || !phone || !password) {
    throw new BadRequestError(
      "All fields are required: first name, last name, email, phone, and password."
    );
  }


    const hashedPassword = await bcrypt.hash(password, 10);

    const query = `
        INSERT INTO users (first_name, last_name, email, phone, password)
        VALUES ($1, $2, (LOWER($3)), $4, $5)
        RETURNING id, first_name, last_name, email, phone, created_at, onboarding_complete;
        `;

    const values = [first_name, last_name, email, phone, hashedPassword];
    const result = await pool.query(query, values).catch((error) => {
       if (error.code === "23505") {
        throw new ConflictError();
      }

      throw new InternalServerError();
    });
    const user = result.rows[0];

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      message: "User created successfully",
      user,
      token,
    });
};

export const signInUser = async (req, res) => {
  let { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ error: "Missing email or password" });

  // Normalize the email to match stored format
  email = email.toLowerCase().trim();

  try {
    // 1. Find the user in PostgreSQL
    const result = await pool.query(
      `
  SELECT id, first_name, last_name, email, phone, created_at, onboarding_complete, password
  FROM users
  WHERE email = $1
  LIMIT 1;
  `,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const user = result.rows[0];

    // Compare hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    // Remove password before sending
    const { password: _, ...safeUser } = user;

    // Generate JWT
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    // Return everything the frontend needs
    res.status(200).json({
      token,
      user: safeUser,
    });
  } catch (err) {
    console.error("Error signing in user:", err);
    res.status(500).json({ error: "Server error" });
  }
};

export const validateDupCreds = async (req, res) => {
  const { email, phone } = req.body;

  // Quick sanity check
  if (!email || !phone) {
    return res.status(400).json({ error: "Missing email or phone" });
  }

  try {
    const query = `
      SELECT email, phone
      FROM users
      WHERE LOWER(email) = LOWER($1)
         OR phone = $2
      LIMIT 1;
    `;

    const values = [email || "", phone || ""];
    const result = await pool.query(query, values);

    if (result.rows.length > 0) {
      const existing = result.rows[0];
      const emailExists =
        existing.email?.toLowerCase() === email?.toLowerCase();
      const phoneExists = existing.phone === phone;

      return res.status(200).json({
        emailExists,
        phoneExists,
        message: "Duplicate found",
      });
    }

    return res.status(200).json({
      emailExists: false,
      phoneExists: false,
      message: "No duplicates found",
    });
  } catch (error) {
    console.error("Validation error:", error);
    return res.status(500).json({ error: "Server error validating user" });
  }
};

export const completeOnboarding = async (req, res) => {
  const { user_id } = req.body;
  try {
    const query = `
      UPDATE users
      SET onboarding_complete = true
      WHERE id = $1
      RETURNING id, onboarding_complete;
    `;
    const result = await pool.query(query, [user_id]);
    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update onboarding status" });
  }
};

export const getCurrentUser = async (req, res) => {
  const userId = req.user.id;

  try {
    const query = `
      SELECT id, first_name, last_name, email, phone, created_at, onboarding_complete
      FROM users
      WHERE id = $1;
    `;
    const result = await pool.query(query, [userId]);
    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch user" });
  }
};
