const transporter = require("../transporters/transporter");

async function sendAppointmentReminder({
  to,
  userName,
  doctorName,
  date,
  time,
  location
}) {
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
      <h2 style="color: #1a73e8;">Upcoming Appointment Reminder</h2>
      
      <p>Hi ${userName},</p>
      
      <p>This is a friendly reminder about your upcoming appointment:</p>

      <div style="margin: 20px 0; padding: 15px; background: #f7faff; border-left: 4px solid #1a73e8;">
        <p><strong>Doctor:</strong> ${doctorName}</p>
        <p><strong>Date:</strong> ${date}</p>
        <p><strong>Time:</strong> ${time}</p>
        <p><strong>Location:</strong> ${location}</p>
      </div>

      <p>Please note: this is not a monitored inbox. Do not respond to this email.</p>

      <hr style="margin-top: 30px;" />
      <p style="font-size: 12px; color: #777;">
        You are receiving this reminder because you opted in to notifications in your MyDocDay account.
      </p>
    </div>
  `;

  return transporter.sendMail({
    from: `"MyDocDay" <${process.env.MAILER_USER}>`,
    to,
    subject: "Appointment Reminder",
    html
  });
}

module.exports = sendAppointmentReminder;

