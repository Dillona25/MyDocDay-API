import pool from "../db/index.js";
import jwt from "jsonwebtoken"

export const createDoctor = async (req, res) => {
  const { user_id, first_name, last_name, specialty, image_url } = req.body;

  if (!user_id || !first_name || !last_name || !specialty) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const query = `
    INSERT INTO doctors (user_id, first_name, last_name, specialty, image_url)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *;
    `;

    const values = [user_id, first_name, last_name, specialty, image_url];
    const result = await pool.query(query, values);

    res.status(201).json({
      message: "Doctor added successfully",
      doctor: result.rows[0],
    });
  } catch (error) {
    console.error("Error adding doctor:", error);
    res.status(500).json({ error: "Server error" });
  }
};

export const getUsersDoctor = async (req, res) => {
  try {
    const query = `SELECT 
    d.*, 
    c.clinic_name,
    c.city,
    c.state,
    c.zipcode
    FROM doctors d
    LEFT JOIN clinics c 
    ON d.clinic_id = c.clinic_id
    WHERE d.user_id = $1;`;
    const values = [req.user.id];
    const result = await pool.query(query, values);

    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching doctors:", error);
    res.status(500).json({ error: "Server error" });
  }
};
