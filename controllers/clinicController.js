import pool from "../db/index.js";

export const createClinic = async (req, res) => {
  const {
    clinicName,
    clinicEmail,
    clinicPhone,
    street,
    city,
    state,
    zipcode,
  } = req.body;

  try {
    const query = `
    INSERT INTO clinics (clinic_name, clinic_email, clinic_phone, street, city, state, zipcode)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *;
    `

    const values = [
    clinicName,
    clinicEmail,
    clinicPhone,
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
