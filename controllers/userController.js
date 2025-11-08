import pool from "../db/index.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import {
  BadRequestError,
  ConflictError,
  InternalServerError,
  UnauthorizedError,
} from "../errors/errors.js";

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

  if (result.rows.length === 0) {
    throw new UnauthorizedError("Invalid email or password");
  }

  const user = result.rows[0];

  // Compare hashed password
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new UnauthorizedError("Invalid email or password");
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

// TODO: Handle this on the frontend with a returned 409 error code.
// export const validateDupCreds = async (req, res) => {
//   const { email, phone } = req.body;

//   // Quick sanity check
//   if (!email || !phone) {
//     return res.status(400).json({ error: "Missing email or phone" });
//   }

//   try {
//     const query = `
//       SELECT email, phone
//       FROM users
//       WHERE LOWER(email) = LOWER($1)
//          OR phone = $2
//       LIMIT 1;
//     `;

//     const values = [email || "", phone || ""];
//     const result = await pool.query(query, values);

//     if (result.rows.length > 0) {
//       const existing = result.rows[0];
//       const emailExists =
//         existing.email?.toLowerCase() === email?.toLowerCase();
//       const phoneExists = existing.phone === phone;

//       return res.status(200).json({
//         emailExists,
//         phoneExists,
//         message: "Duplicate found",
//       });
//     }

//     return res.status(200).json({
//       emailExists: false,
//       phoneExists: false,
//       message: "No duplicates found",
//     });
//   } catch (error) {
//     console.error("Validation error:", error);
//     return res.status(500).json({ error: "Server error validating user" });
//   }
// };

export const completeOnboarding = async (req, res) => {
  const { user_id } = req.body;

  if (!user_id) {
    throw new BadRequestError("User ID is required.");
  }

  try {
    const query = `
      UPDATE users
      SET onboarding_complete = true
      WHERE id = $1
      RETURNING id, onboarding_complete;
    `;
    const result = await pool.query(query, [user_id]);

    if (result.rows.length === 0) {
      console.warn(`Onboarding update failed — no user found for ID: ${user_id}`);
      throw new InternalServerError("Unable to complete onboarding process.");
    }

    res.status(200).json({
      message: "Onboarding completed successfully.",
      user: result.rows[0],
    });
  } catch (err) {
    console.error("Error completing onboarding:", err);
    throw new InternalServerError("Unable to complete onboarding process.");
  }
};

export const getCurrentUser = async (req, res) => {
  const userId = req.user?.id;

  if (!userId) {
    console.error("getCurrentUser called without a valid user on req.user");
    throw new InternalServerError("Unable to fetch user information.");
  }

  const query = `
    SELECT id, first_name, last_name, email, phone, created_at, onboarding_complete
    FROM userss
    WHERE id = $1;
  `;

  try {
    const result = await pool.query(query, [userId]);

    if (result.rows.length === 0) {
      console.error(`No user record found for authenticated ID: ${userId}`);
      throw new InternalServerError("Server error: unable to fetch user information.");
    }

    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error("Database error retrieving current user:", err);
    throw new InternalServerError("Server error: unable to fetch user information.");
  }
};
