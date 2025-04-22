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

// Serve the login page on the root path
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "login.html"));
});

// Handle POST request for login
app.post("/", async (req, res) => {
    const { username, password } = req.body;

    try {
        const sql = `SELECT * FROM users WHERE username='${username}' AND password='${password}'`;
        const [results] = await db.query(sql);

        if (results.length > 0) {
            // Generate a JWT token
            const token = jwt.sign({ username: username }, JWT_SECRET_KEY, { expiresIn: '1h' });

            // Set the token as a cookie
            res.cookie("authToken", token, { httpOnly: true, maxAge: 3600000 }); // expires in 1 hour

            // Show flag and proceed button
            res.send(`
                <html>
                    <head>
                        <title>Login Successful</title>
                     <style>
    body {
        background: url('https://gifrun.blob.core.windows.net/temp/5c6f41b831fb433384bb28d26bb041ac.webp') no-repeat center center fixed;
        background-size: cover;
        text-align: center;
        font-family: Arial, sans-serif;
        height: 100vh;
        display: flex;
        justify-content: center;
        align-items: flex-end; /* Moves text to the bottom */
        padding-bottom: 50px; /* Adds space from the bottom */
    }
    h1 {
        font-size: 2.5rem;
        font-weight: bold;
        color: white;
        text-shadow: 3px 3px 10px black;
    }
    p {
        font-size: 1.2rem;
        font-weight: bold;
        color: white;
        text-shadow: 2px 2px 6px white;

    }
        .flag
        {
        color: white;
        }
</style>



                    </head>
                    <body>
                        <div class="container">
                            <h1>Congratulations, ${username}!</h1>
                            <p>You have successfully logged in.</p>
                            <div class="flag">P0{I_AM_THE_MONARCH}</div>
                            <br>
                            <button class="btn" onclick="window.location.href='/challenge'">Proceed to Next Challenge</button>
                        </div>
                    </body>
                </html>
            `);
        } else {
            res.send('Invalid credentials. Try again.');
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});


// Middleware to check if the user has a valid JWT
function verifyToken(req, res, next) {
    const token = req.cookies.authToken;

    if (!token) {
        return res.redirect("/"); // No token, redirect to login
    }

    jwt.verify(token, JWT_SECRET_KEY, (err, decoded) => {
        if (err) {
            return res.redirect("/"); // Invalid token, redirect to login
        }
        req.user = decoded; // Attach decoded user data to the request
        next(); // Proceed to next middleware or route handler
    });
}

// Serve the XSS challenge HTML file, but only if the user is authenticated
app.get("/challenge", verifyToken, (req, res) => {
    res.sendFile(path.join(__dirname, "public", "challenge.html"));
});

// Handling traversal for challenge (ensure path encoding works properly)
app.get("/challenge/*", verifyToken, (req, res) => {
    const decodedPath = decodeURIComponent(req.path);

    if (decodedPath.includes("/challenge/") && decodedPath.includes("/..")) {
        res.sendFile(path.join(__dirname, "public", "challenge.html"));
    } else {
        res.status(404).send("Not Found");
    }
});




app.get("/admin", verifyToken, (req, res) => {
    // Check if the request is coming from an XSS exploit
    const referer = req.get("Referer") || "";
    const isFetchRequest = req.get("Sec-Fetch-Site") || "";

    if (!referer.includes("/challenge") || isFetchRequest === "none") {
        return res.send(`
            <html>
                <head>
                    <title>Final Battle</title>
                    <style>
                        body {
                            background: url('https://images8.alphacoders.com/139/1391602.jpg') no-repeat center center fixed;
                            background-size: cover;
                            text-align: center;
                            font-family: Arial, sans-serif;
                            padding-top: 20%;
                        }
                        h1 {
                            font-size: 2.5rem;
                            color: black; 
                            text-shadow: 2px 2px 10px white;
                        }
                        p {
                            font-size: 1.2rem;
                            color: black; 
                            text-shadow: 2px 2px 5px white;
                        }
                    </style>
                </head>
                <body>
                    <h1>🏆 You must prove yourself in the shadows! 🏆</h1>
                    <p>Only those who truly master the <b>art of exploitation</b> can reveal the ultimate truth...</p>
                    <p>Try harder. The Monarch awaits.</p>
                </body>
            </html>
        `);
    }

    // If the request is coming from an XSS exploit, return the flag
    res.json({ flag: "P0{The_One_Who_Stands_Above_All}" });
});


const PORT = 3000;
app.listen(PORT, () => console.log(`CTF Challenge running on port ${PORT}`));
