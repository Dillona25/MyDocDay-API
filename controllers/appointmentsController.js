import pool from "../db/index.js";

export const createAppointment = async (req, res) => {
  const {
    user_id,
    doctor_id,
    doctor_name,
    appointment_title,
    appointment_type,
    appointment_date,
    appointment_time,
  } = req.body;

  if (
    !user_id ||
    !doctor_id ||
    !doctor_name ||
    !appointment_title ||
    !appointment_date || !appointment_time
  ) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const query = `
    INSERT INTO appointments (user_id, doctor_id, doctor_name, appointment_title, appointment_type, appointment_date, appointment_time)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *;
    `;

    const values = [
      user_id,
      doctor_id,
      doctor_name,
      appointment_title,
      appointment_type,
      appointment_date,
      appointment_time,
    ];
    const result = await pool.query(query, values);

    res.status(201).json({
      message: "Appointment added successfully",
      appointment: result.rows[0],
    });
  } catch (error) {
    console.error("Error adding doctor:", error);
    res.status(500).json({ error: "Server error" });
  }
};

export const getUsersAppointments = async (req, res) => {
    try {
    const query = `SELECT * FROM appointments
    WHERE user_id = $1
    ORDER BY appointment_date ASC, appointment_time ASC`;
    const values = [req.user.id];
    const result = await pool.query(query, values);

    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching doctors:", error);
    res.status(500).json({ error: "Server error" });
  }
}
