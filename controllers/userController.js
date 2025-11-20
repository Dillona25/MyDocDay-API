import pool from "../db/index.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import {
  BadRequestError,
  ConflictError,
  InternalServerError,
  NotFoundError,
  UnauthorizedError,
} from "../errors/errors.js";

export const createUser = async (req, res) => {
  const { first_name, last_name, email, phone, password } = req.body;

  // Error handle for required fields
  if (!first_name || !last_name || !email || !phone || !password) {
    throw new BadRequestError();
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const query = `
        INSERT INTO users (first_name, last_name, email, phone, password)
        VALUES ($1, $2, (LOWER($3)), $4, $5)
        RETURNING id, first_name, last_name, email, phone, created_at, onboarding_complete;
        `;

  const values = [first_name, last_name, email, phone, hashedPassword];
  const result = await pool.query(query, values).catch((error) => {
    // Error handle for a duplication.
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

  // Erropr handle for required fields
  if (!email || !password) {
    throw new BadRequestError();
  }

  // Normalize the email to match stored format
  email = email.toLowerCase().trim();

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

  // Handle for invalid email or password
  if (result.rows.length === 0) {
    throw new UnauthorizedError();
  }

  const user = result.rows[0];

  // Compare hashed password
  const isMatch = await bcrypt.compare(password, user.password);
  // If password does not match, throw an auth error
  if (!isMatch) {
    throw new UnauthorizedError();
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
};

export const completeOnboarding = async (req, res) => {
  const { user_id } = req.body;

  // Throw error if no user ID. T
  if (!user_id) {
    throw new BadRequestError();
  }

  const query = `
      UPDATE users
      SET onboarding_complete = true
      WHERE id = $1
      RETURNING id, onboarding_complete;
    `;
  const result = await pool.query(query, [user_id]);

  // If no user ID was found
  if (result.rows.length === 0) {
    throw new InternalServerError();
  }

  res.status(200).json({
    message: "Onboarding completed successfully.",
    user: result.rows[0],
  });
};

export const getCurrentUser = async (req, res) => {
  const userId = req.user?.id;

  if (!userId) {
    throw new NotFoundError();
  }

  const query = `
    SELECT id, first_name, last_name, email, phone, created_at, onboarding_complete
    FROM users
    WHERE id = $1;
  `;

  const result = await pool.query(query, [userId]);

  // If the WHERE clause fails. Im making a server error because in MOST cases it will be..
  if (result.rows.length === 0) {
    throw new InternalServerError();
  }

  res.status(200).json(result.rows[0]);
};
