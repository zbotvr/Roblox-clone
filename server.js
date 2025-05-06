// server.js const express = require('express'); const bcrypt = require('bcrypt'); const session = require('express-session'); const sqlite3 = require('sqlite3').verbose(); const path = require('path'); const app = express(); const PORT = process.env.PORT || 3000;

// Setup SQLite const db = new sqlite3.Database('./users.db'); db.run(CREATE TABLE IF NOT EXISTS users ( id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE, password TEXT ));

// Middleware app.use(express.json()); app.use(express.urlencoded({ extended: true })); app.use(session({ secret: 'supersecretkey', resave: false, saveUninitialized: true, }));

// Routes app.post('/api/register', async (req, res) => { const { username, password } = req.body; if (!username || !password) return res.status(400).send('Missing fields'); const hashedPassword = await bcrypt.hash(password, 10); db.run(INSERT INTO users (username, password) VALUES (?, ?), [username, hashedPassword], function (err) { if (err) return res.status(400).send('User exists'); req.session.userId = this.lastID; res.send('Registered successfully'); }); });

app.post('/api/login', (req, res) => { const { username, password } = req.body; db.get(SELECT * FROM users WHERE username = ?, [username], async (err, user) => { if (err || !user) return res.status(400).send('Invalid credentials'); const valid = await bcrypt.compare(password, user.password); if (!valid) return res.status(400).send('Invalid credentials'); req.session.userId = user.id; res.send('Logged in'); }); });

app.post('/api/logout', (req, res) => { req.session.destroy(); res.send('Logged out'); });

app.get('/api/profile', (req, res) => { if (!req.session.userId) return res.status(401).send('Not logged in'); db.get(SELECT id, username FROM users WHERE id = ?, [req.session.userId], (err, user) => { if (err || !user) return res.status(400).send('User not found'); res.json(user); }); });

// Serve static frontend if deployed together app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, () => console.log(Server running on port ${PORT}));

