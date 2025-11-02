import pool from "../db/index.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const hash = await bcrypt.hash("SuperSecret123", 10);
console.log("new hash", hash);

export const createUser = async (req, res) => {

  const { first_name, last_name, email, phone, password } = req.body;

  if (!first_name || !last_name || !email || !phone || !password) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const query = `
        INSERT INTO users (first_name, last_name, email, phone, password)
        VALUES ($1, $2, (LOWER($3)), $4, $5)
        RETURNING id, first_name, last_name, email, phone, created_at;
        `;

    const values = [first_name, last_name, email, phone, hashedPassword];
    const result = await pool.query(query, values);
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
  } catch (error) {
    console.error("Error creating user:", error);
    if (error.code === "23505") {
      res
        .status(400)
        .json({
          error: "Email or phone number already in use. Try signing in.",
        });
    } else {
      res.status(500).json({ error: "Server error" });
    }
  }
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
      "SELECT * FROM users WHERE email = $1 LIMIT 1",
      [email]
    );

    const user = result.rows[0];
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // 2. Compare the password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // 3. Create a JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // 4. Return token + basic user info
    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,  
        email: user.email,
      },
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

export const validatePasswordc= async (req, res) => {
  
}

