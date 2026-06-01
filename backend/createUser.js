const db = require('./config/db');
const bcrypt = require('bcrypt');

async function createUser() {
    const username = "user";
    const name = "Tan";
    const role = "user2";
    const plainPassword = "User1234";

    const hash = await bcrypt.hash(plainPassword, 10);

    // Check if user already exists
    const [rows] = await db.query(
        "SELECT id FROM users WHERE username = ?",
        [username]
    );

    if (rows.length > 0) {
        console.log("User already exists");
        process.exit();
    }

    await db.query(
        "INSERT INTO users (name, username, password, role) VALUES (?, ?, ?, ?)",
        [name, username, hash, role]
    );

    console.log("User account created:");
    console.log("username:", username);
    console.log("password:", plainPassword);
    process.exit();
}

createUser();
