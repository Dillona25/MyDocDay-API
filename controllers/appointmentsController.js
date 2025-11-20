import pool from "../db/index.js";
import {
  BadRequestError,
  InternalServerError,
  NotFoundError,
} from "../errors/errors.js";

export const createAppointment = async (req, res) => {
  const {
    doctor_id,
    appointment_title,
    appointment_type,
    appointment_date,
    appointment_time,
  } = req.body;

  const user_id = req.user?.id;

  if (
    !user_id ||
    !doctor_id ||
    !appointment_title ||
    !appointment_date ||
    !appointment_time
  ) {
    throw new BadRequestError("Missing required fields.");
  }

  const query = `
    INSERT INTO appointments 
      (user_id, doctor_id, appointment_title, appointment_type, appointment_date, appointment_time)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *;
  `;

  const values = [
    user_id,
    doctor_id,
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
};

export const getUsersAppointments = async (req, res) => {
  const query = `SELECT * FROM appointments
    WHERE user_id = $1
    ORDER BY appointment_date ASC, appointment_time ASC`;
  const values = [req.user.id];
  const result = await pool.query(query, values);

  res.status(200).json(result.rows);
};

export const deleteAppointment = async (req, res) => {
  const { id } = req.params;

  const query = `DELETE FROM appointments WHERE id = $1`;
  const values = [id];
  const result = await pool.query(query, values);

  // If no rows were deleted, the appointment didn't exist
  if (result.rowCount === 0) {
    throw new NotFoundError();
  }

  res.status(204).send();
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
