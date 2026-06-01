const db = require('./config/db');
const bcrypt = require('bcrypt');

async function resetAdminPassword() {
    const hash = await bcrypt.hash("admin123", 10); // your new password
    await db.query("UPDATE users SET password = ? WHERE username = 'admin'", [hash]);
    console.log("Admin password reset to admin123");
    process.exit();
}

resetAdminPassword();
