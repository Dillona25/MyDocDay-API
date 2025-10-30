import pool from "../db/index.js";

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

    // If no clinic_id provided, create the clinic first
    if (!resolvedClinicId && clinic_name) {
      const clinicQuery = await client.query(
        `INSERT INTO clinics (clinic_name, clinic_email, clinic_phone, street, city, state, zipcode)
         VALUES ($1,$2,$3,$4,$5,$6,$7)
         RETURNING clinic_id;`, [
          clinic_name,
          clinic_email,
          clinic_phone,
          street,
          city,
          state,
          zipcode
        ]
      );
      resolvedClinicId = clinicQuery.rows[0].clinic_id;
    }

    // Minimal requirement: doctor must have a name; clinic_id is optional (can be null)
    if (!first_name || !last_name) {
      await client.query("ROLLBACK");
      return res
        .status(400)
        .json({ error: "Doctor first_name and last_name are required" });
    }

    const doctorQuery = await client.query(
      `INSERT INTO doctors (user_id, first_name, last_name, specialty, image_url, clinic_id)
       VALUES ($1,$2,$3,$4,$5,$6)
       RETURNING *;`,
      [user_id, first_name, last_name, specialty, image_url, resolvedClinicId]
    );

    await client.query("COMMIT");
    return res.status(201).json({
      doctor: doctorQuery.rows[0],
      clinic_id: resolvedClinicId ?? null,
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("createDoctorWithClinic error:", err);
    return res.status(500).json({ error: "Server error" });
  } finally {
    client.release();
  }
};
