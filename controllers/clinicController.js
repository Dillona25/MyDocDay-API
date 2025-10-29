import pool from "../db/index"

export const createClinic = (req, res) => {
    const {clinic_name, clinic_email, clinic_phone, street, city, state, zipcode } = req.body;
}