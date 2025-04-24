const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const db = require("./db");

const app = express();

// Middleware for parsing cookies
app.use(cookieParser());

// Middleware for parsing form data
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files from 'public' folder
app.use(express.static(path.join(__dirname, "public")));

// Secret key for JWT signing
const JWT_SECRET_KEY = 'your-secret-key';

// Helper to detect Base64
function isBase64(str) {
    try {
        return Buffer.from(str, 'base64').toString('base64') === str;
    } catch (e) {
        return false;
    }
}

// Serve the login page on the root path
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "login.html"));
});

// Handle POST request for login
app.post("/", async (req, res) => {
    const { username, password } = req.body;

    try {
        // If the password is Base64 encoded, decode it and perform SQLi
        if (isBase64(password)) {
            const decoded = Buffer.from(password, 'base64').toString('utf-8');
            const sql = `SELECT * FROM users WHERE username='${username}' AND password='${decoded}'`;
            const [results] = await db.query(sql);

            if (results.length > 0) {
                const token = jwt.sign({ username }, JWT_SECRET_KEY, { expiresIn: '1h' });
                res.cookie("authToken", token, { httpOnly: true, maxAge: 3600000 });
                return res.send(`
                    <html>
                        <head>
                            <title>Login Successful</title>
                            <style>
                                body {
                                    background: url('https://images5.alphacoders.com/128/1288655.png') no-repeat center center fixed;
                                    background-size: cover;
                                    text-align: center;
                                    font-family: Arial, sans-serif;
                                    height: 100vh;
                                    display: flex;
                                    justify-content: center;
                                    align-items: center;
                                    color: white;
                                }
                                h1 {
                                    font-size: 2.5rem;
                                    text-shadow: 2px 2px 10px black;
                                }
                                p {
                                    font-size: 1.2rem;
                                    margin-top: 1rem;
                                    text-shadow: 1px 1px 5px black;
                                }
                                .flag {
                                    margin-top: 2rem;
                                    font-size: 1.5rem;
                                    font-weight: bold;
                                    color: gold;
                                    text-shadow: 1px 1px 5px black;
                                }
                                .btn {
                                    margin-top: 2rem;
                                    padding: 10px 20px;
                                    font-size: 1rem;
                                    cursor: pointer;
                                }
                            </style>
                        </head>
                        <body>
                            <div>
                                <h1>Congratulations, ${username}!</h1>
                                <p>You have ascended as the Shadow Monarch.</p>
                                <div class="flag">P0{I_AM_THE_MONARCH}</div>
                                <button class="btn" onclick="window.location.href='/challenge'">Enter the Dungeon</button>
                            </div>
                        </body>
                    </html>
                `);
            }
            return res.status(401).send(`
                <html>
                    <head>
                        <title>Authentication Failed</title>
                        <style>
                            body {
                                background: url('https://images6.alphacoders.com/105/1055057.png') no-repeat center center fixed;
                                background-size: cover;
                                font-family: Arial, sans-serif;
                                color: red;
                                text-align: center;
                                height: 100vh;
                                display: flex;
                                justify-content: center;
                                align-items: center;
                            }
                            h1 {
                                font-size: 3rem;
                                text-shadow: 2px 2px 10px black;
                            }
                            p {
                                font-size: 1.2rem;
                                text-shadow: 1px 1px 5px black;
                            }
                            button {
                                margin-top: 2rem;
                                padding: 10px 20px;
                                font-size: 1rem;
                                cursor: pointer;
                            }
                        </style>
                    </head>
                    <body>
                        <div>
                            <h1>❌ Authentication Failed</h1>
                            <p>You are not ready to wield the power of the Shadow Monarch.</p>
                            <p>Try again, Hunter.</p>
                            <button onclick="location.href='/'">Return to Login</button>
                        </div>
                    </body>
                </html>
            `);
        }

        // Otherwise, treat password normally and block simple SQLi patterns
        const blockedPatterns = [/--/, /#/, /'/, /;/, /\*/];
        const allowedChars = /^[a-zA-Z0-9 ]*$/;
        if (!allowedChars.test(password) || blockedPatterns.some(p => p.test(password))) {
            return res.send('Invalid input: password contains forbidden characters.');
        }

        const encodedPassword = Buffer.from(password).toString('base64');
        const sql = "SELECT * FROM users WHERE username = ? AND password = ?";
        const [results] = await db.query(sql, [username, encodedPassword]);

        if (results.length > 0) {
            const token = jwt.sign({ username }, JWT_SECRET_KEY, { expiresIn: '1h' });
            res.cookie("authToken", token, { httpOnly: true, maxAge: 3600000 });
            return res.send(`
                <html><body>
                <h1>Congrats ${username}</h1>
                <div class="flag">P0{I_AM_THE_MONARCH}</div>
                <button onclick="location.href='/challenge'">Next</button>
                </body></html>
            `);
        }

        return res.status(401).send(`
            <html>
                <head>
                    <title>Wrong Credentials</title>
                    <style>
                        body {
                            background: url('https://images4.alphacoders.com/134/1347366.png') no-repeat center center fixed;
                            background-size: cover;
                            font-family: Arial, sans-serif;
                            color: white;
                            text-align: center;
                            height: 100vh;
                            display: flex;
                            justify-content: center;
                            align-items: center;
                            flex-direction: column;
                            text-shadow: 1px 1px 5px black;
                        }
                        h1 {
                            font-size: 3rem;
                            color: crimson;
                        }
                        p {
                            font-size: 1.2rem;
                            margin-top: 1rem;
                        }
                        button {
                            margin-top: 2rem;
                            padding: 10px 20px;
                            font-size: 1rem;
                            cursor: pointer;
                        }
                    </style>
                </head>
                <body>
                    <div>
                        <h1>😈 You Have Been Defeated</h1>
                        <p>Incorrect credentials. You were not strong enough to ascend.</p>
                        <p>Try again, brave Hunter...</p>
                        <button onclick="location.href='/'">Return to Login</button>
                    </div>
                </body>
            </html>
        `);
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
});

// Middleware to check if the user has a valid JWT
function verifyToken(req, res, next) {
    const token = req.cookies.authToken;
    if (!token) return res.redirect("/");
    jwt.verify(token, JWT_SECRET_KEY, (err, decoded) => {
        if (err) return res.redirect("/");
        req.user = decoded;
        next();
    });
}

// Serve the XSS challenge HTML file
app.get("/challenge", verifyToken, (req, res) => {
    res.sendFile(path.join(__dirname, "public", "challenge.html"));
});

// Directory traversal challenge
app.get("/challenge/*", verifyToken, (req, res) => {
    const decodedPath = decodeURIComponent(req.path);
    if (decodedPath.includes("/challenge/") && decodedPath.includes("/..")) {
        return res.sendFile(path.join(__dirname, "public", "challenge.html"));
    }
    res.status(404).send("Not Found");
});

// Final admin route
app.get("/admin", verifyToken, (req, res) => {
    const referer = req.get("Referer") || "";
    const fetchSite = req.get("Sec-Fetch-Site") || "";
    if (!referer.includes("/challenge") || fetchSite === "none") {
        return res.send(`
            <html><body>
            <h1>🏆 You must prove yourself in the shadows! 🏆</h1>
            <p>Only those who truly master the <b>art of exploitation</b> can reveal the ultimate truth...</p>
            </body></html>
        `);
    }
    res.json({ flag: "P0{The_One_Who_Stands_Above_All}" });
});

const PORT = 5000;
app.listen(PORT, () => console.log(`CTF Challenge running on port ${PORT}`));
