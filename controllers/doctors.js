import pool from "../db/index.js";
import { BadRequestError, InternalServerError } from "../errors/errors.js";

export const createDoctorWithClinic = async (req, res) => {
  const {
    user_id,
    first_name,
    last_name,
    specialty,
    image_url,
    clinic_id,
    clinic_name,
    clinic_email,
    clinic_phone,
    street,
    city,
    state,
    zipcode,
  } = req.body;

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    let resolvedClinicId = clinic_id ?? null;
    let clinicQuery = null;

    if (!resolvedClinicId && clinic_name) {
      clinicQuery = await client.query(
        `INSERT INTO clinics (clinic_name, clinic_email, clinic_phone, street, city, state, zipcode)
         VALUES ($1,$2,$3,$4,$5,$6,$7)
         RETURNING *;`,
        [clinic_name, clinic_email, clinic_phone, street, city, state, zipcode]
      );

      resolvedClinicId = clinicQuery.rows[0].clinic_id;
    }

    if (!first_name || !last_name || !specialty || !clinic_name) {
      await client.query("ROLLBACK");
      throw new BadRequestError(
        "All fields are required: first name, last name, speacialty, and clinic name"
      );
    }

    const doctorQuery = await client.query(
      `INSERT INTO doctors (user_id, first_name, last_name, specialty, image_url, clinic_id)
       VALUES ($1,$2,$3,$4,$5,$6)
       RETURNING *;`,
      [user_id, first_name, last_name, specialty, image_url, resolvedClinicId]
    );

    await client.query("COMMIT");

    const responseClinic = clinicQuery ? clinicQuery.rows[0] : null;

    return res.status(201).json({
      doctor: doctorQuery.rows[0],
      clinic: responseClinic,
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("createDoctorWithClinic error:", err);
    return res.status(500).json({ error: "Server error" });
  } finally {
    client.release();
  }
};

export const getUsersDoctor = async (req, res) => {
  try {
    const query = `SELECT 
    d.*, 
    c.*
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

export const updateDoctor = async (req, res) => {
  const doctorId = req.params.id;
  const fieldsToUpdate = req.body;

  if (!doctorId) {
    throw new BadRequestError("No doctor ID provided");
  }

  if (Object.entries(fieldsToUpdate).length === 0) {
    throw new BadRequestError("No fields provided for update");
  }

  // We need to differ between clinic and doctor updates
  const doctorFields = ["first_name", "last_name", "specialty", "image_url"];
  const clinicFields = [
    "clinic_name",
    "clinic_email",
    "clinic_phone",
    "street",
    "city",
    "state",
    "zipcode",
  ];

  // Building our two different objects of updates
  const doctorUpdates = {};
  const clinicUpdates = {};

  // TODO: Make sense of this block
  for (const [key, value] of Object.entries(fieldsToUpdate)) {
    if (doctorFields.includes(key)) doctorUpdates[key] = value;
    if (clinicFields.includes(key)) clinicUpdates[key] = value;
  }

  try {
    let doctorResult = null;
    let clinicResult = null;

    //? Doctor Updates Here
    if (Object.keys(doctorUpdates).length > 0) {
      const set = [];
      const values = [];
      let index = 1;

      for (const [key, value] of Object.entries(doctorUpdates)) {
        set.push(`${key} = $${index}`);
        values.push(value);
        index++;
      }

      values.push(doctorId);

      const query = `
        UPDATE doctors
        SET ${set.join(", ")}
        WHERE id = $${index}
        RETURNING *;
      `;

      const result = await pool.query(query, values);
      doctorResult = result.rows[0];
    }

    if (Object.keys(clinicUpdates).length > 0) {
      const set = [];
      const values = [];
      let index = 1;

      for (const [key, value] of Object.entries(clinicUpdates)) {
        set.push(`${key} = $${index}`);
        values.push(value);
        index++;
      }

      values.push(doctorId);

      const query = `
      UPDATE clinics AS c
      SET ${set.join(", ")}
      FROM doctors AS d
      WHERE d.id = $${index}
      AND c.clinic_id = d.clinic_id
      RETURNING c.*;`;

      const result = await pool.query(query, values);
      clinicResult = result.rows[0];
    }

    res.status(200).json({
      message: "Doctor and/or clinic updated successfully",
      doctor: doctorResult,
      clinic: clinicResult,
    });
  } catch (error) {
    throw new InternalServerError("Server Error");
  }
};

export const deleteDoctor = async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    await client.query(
      "DELETE FROM appointments WHERE doctor_id = $1",
      [id]
    );

    const doctorResult = await client.query(
      "DELETE FROM doctors WHERE id = $1 RETURNING id",
      [id]
    );

    if (doctorResult.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Doctor not found" });
    }

    await client.query("COMMIT");
    return res.status(204).send();
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error deleting doctor:", error);
    return res.status(500).json({ error: "Server error" });
  } finally {
    client.release();
  }
};

