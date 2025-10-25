import pool from "../db/index.js";
import bcrypt from "bcrypt";

export const createUser = async (req, res) => {
    const {first_name, last_name, email, phone, password} = req.body;

    if (!first_name || !last_name || !email || !phone || !password) {
        return res.status(400).json({error: "Missing required fields"})
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10)

        const query = `
        INSERT INTO users (first_name, last_name, email, phone, password)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, first_name, last_name, email, phone, created_at;
        `;

        const values = [first_name, last_name, email, phone, hashedPassword]
        const result = await pool.query(query, values) 

        res.status(201).json({
            message: "New user created!",
            user: result.rows[0]
        })
    } catch (error) {
        console.error("Error creating user:", error);
    if (error.code === "23505") {
      // Duplicate email error
      res.status(400).json({ error: "Email already in use" });
    } else {
      res.status(500).json({ error: "Server error" });
    }
    }
}