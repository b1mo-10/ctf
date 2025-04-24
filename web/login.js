const express = require('express');
const router = express.Router();
const db = require('./db');

// Handle login request
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        // Only password is vulnerable to SQLi, username is parameterized
        const sql = `SELECT * FROM users WHERE username = ? AND password = MD5('${password}')`;
        const [results] = await db.query(sql, [username]);

        if (results.length > 0) {
            // Show the flag and a button to proceed to the challenge
            return res.send(`
                <html>
                <head>
                    <title>SQL Challenge Completed</title>
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            text-align: center;
                            background-color: #121212;
                            color: white;
                            padding: 20px;
                        }
                        .container {
                            margin-top: 50px;
                        }
                        .flag {
                            font-size: 24px;
                            font-weight: bold;
                            background-color: #222;
                            display: inline-block;
                            padding: 10px 20px;
                            border-radius: 5px;
                            border: 2px solid #FFD700;
                            margin-bottom: 20px;
                        }
                        .btn {
                            background-color: #FFD700;
                            color: black;
                            padding: 10px 20px;
                            font-size: 18px;
                            border: none;
                            cursor: pointer;
                            border-radius: 5px;
                        }
                        .btn:hover {
                            background-color: #FFA500;
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h1>Congratulations! You Completed the First Challenge</h1>
                        <div class="flag">P0{I_AM_THE_MONARCH}</div>
                        <br>
                        <button class="btn" onclick="window.location.href='/challenge'">Proceed to Next Challenge</button>
                    </div>
                </body>
                </html>
            `);
        } else {
            return res.send('System is chllange your skills ');
        }
    } catch (error) {
        console.error(error);
        return res.status(500).send('bimoo');
    }
});

module.exports = router;
