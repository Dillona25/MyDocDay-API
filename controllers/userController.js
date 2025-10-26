import pool from "../db/index.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export const createUser = async (req, res) => {
  const { first_name, last_name, email, phone, password } = req.body;

  if (!first_name || !last_name || !email || !phone || !password) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const query = `
        INSERT INTO users (first_name, last_name, email, phone, password)
        VALUES ($1, $2, $3, $4, $5)
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
      res.status(400).json({ error: "Email already in use" });
    } else {
      res.status(500).json({ error: "Server error" });
    }
  }
};
