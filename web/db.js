const mysql = require("mysql2/promise");

const pool = mysql.createPool({
    host: "mysql",
    user: "root",
    password: "rootpassword",
    database: "ctf",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});

module.exports = pool;
