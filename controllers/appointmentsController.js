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
    !appointment_date ||
    !appointment_time
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
};

export const deleteAppointment = async (req, res) => {
  const { id } = req.params;

  try {
    const query = `DELETE FROM appointments WHERE id = $1`;
    const values = [id];
    const result = await pool.query(query, values);

    // If no rows were deleted, the appointment didn't exist
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Appointment not found" });
    }

    res.status(200).send();
  } catch (error) {
    console.error("Error deleting appointment:", error);
    res.status(500).json({ error: "Server error" });
  }
};

export const updateAppointment = async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

   // If no fields provided, no update to perform
  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: "No fields provided for update" });
  }

  try {
    // Building our SET..
    const setClauses = [];
    const values = [];
    let index = 1;

    // Updates is a KV pair and we push the index to the key and the value is the updated value
    for (const [key, value] of Object.entries(updates)) {
      setClauses.push(`${key} = $${index}`);
      values.push(value);
      index++;
    }
    values.push(id);

    const query = `
      UPDATE appointments
      SET ${setClauses.join(", ")}
      WHERE id = $${index}
      RETURNING *;
    `;

    const result = await pool.query(query, values);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Appointment not found" });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error("Error updating appointment:", error);
    res.status(500).json({ error: "Server error" });
  }
};
