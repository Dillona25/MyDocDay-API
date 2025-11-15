import pool from "../db/index.js";
import {
  BadRequestError,
  InternalServerError,
  NotFoundError,
} from "../errors/errors.js";

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

    res.status(204).send();
  } catch (error) {
    console.error("Error deleting appointment:", error);
    res.status(500).json({ error: "Server error" });
  }
};

export const updateAppointment = async (req, res) => {
  const appointmentId = req.params.id;
  const fieldsToUpdate = req.body;

  if (!appointmentId) {
    throw new BadRequestError("Missing Appointment ID");
  }

  // If our request body is empty, end the API call
  if (Object.keys(fieldsToUpdate) === 0) {
    throw new BadRequestError("No fields provided for update");
  }

  // Build our SET
  const setClause = [];
  const values = [];

  // Loop and fill in our set
  let index = 1;
  for (const [key, value] of Object.entries(fieldsToUpdate)) {
    setClause.push(`${key} = $${index}`);
    values.push(value);
    index++;
  }

  // Add userId as the final param for WHERE clause
  values.push(appointmentId);

  const query = `UPDATE appointments SET ${setClause.join(", ")}
  WHERE id = $${index} RETURNING *;`;

  try {
    const result = await pool.query(query, values);

    if (result.rowCount === 0) {
      throw new NotFoundError("Appointment not found");
    }

    res.status(200).json(result.rows);
  } catch (error) {
    if (error.status) {
      throw error;
    }
    
    throw new InternalServerError("Internal server error");
  }
};
