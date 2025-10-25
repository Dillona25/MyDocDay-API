import pool from "../db/index.js";

export const createDoctor = async (req, res) => {
     const { user_id, first_name, last_name, specialty, image_url } = req.body;

  if (!user_id || !first_name || !last_name) {
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
}