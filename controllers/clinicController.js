import pool from "../db/index.js";

export const createClinic = async (req, res) => {
  const {
    name,
    email,
    phone,
    street,
    city,
    state,
    zipcode,
  } = req.body;

  if (!name) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const query = `
    INSERT INTO clinics (name, email, phone, street, city, state, zipcode)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *;
    `

    const values = [
    name,
    email,
    phone,
    street,
    city,
    state,
    zipcode,];
    const result = await pool.query(query, values);

    res.status(201).json({
      message: "Clinic added successfully",
      clinic: result.rows[0],
    });
  } catch (error) {
    console.error("Error adding doctor:", error);
    res.status(500).json({ error: "Server error" });
  }
};
