require("dotenv").config();

const sendAppointmentReminder = require("../templates/ReminderTemplate");

(async () => {
  try {
    const info = await sendAppointmentReminder({
      to: "dillonarnold02@outlook.com",
      userName: "Dillon",
      doctorName: "Dr. Mason",
      date: "January 14, 2025",
      time: "3:30 PM",
      location: "Lincoln Family Clinic – 123 Main St"
    });

    console.log("Reminder sent:", info.messageId);
  } catch (err) {
    console.error("Error sending reminder:", err);
  }
})();
