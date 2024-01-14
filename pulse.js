const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const mysql = require('mysql2');

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'dbadm',
    password: 'P@ssw0rd',
    database: 'pulse',
    "multipleStatements": true
});



router.get('/login', (req, res) => {
    res.render('login', { one: true });
});

router.get('/index', (req, res) => {
    res.render('index', { name: req.session.name });
});



router.get('/addteam', (req, res) => {
    res.render('addteam', { name: req.session.name });
});


router.post('/auth/login', async (req, res) => {
    try {
        const { username, password, role } = req.body;
        const query = 'SELECT * FROM Users WHERE email = ? AND role = ?'; // Add role to the query
        connection.execute(query, [username, role], async (err, results) => {
            if (err) {
                console.error("Database error:", err);
                return res.status(500).send('Database error');
            }
            if (results.length === 0) {
                return res.render('login', { errorMessage: 'Invalid username, password, or role' });
            }
            const user = results[0];

            // Check password
            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
                return res.render('login', { errorMessage: 'Invalid username or password' });
            }

            // Save user ID in the session
            req.session.user_id = user.user_id;
            req.session.name = user.name;

            // Redirect to the appropriate dashboard route based on the role
            if (user.role === 'Project Manager') {
                res.redirect('/dashboard');
            } else if (user.role === 'Team Member') {
                res.redirect('/teamdashboard');
            } else {
                res.status(500).send('Server error');
            }

        });
    } catch (error) {
        console.error("Detailed error:", error);
        res.status(500).send('Server error');
    }
});



router.get('/project-manager', (req, res) => {
    const query = 'SELECT user_id, name, email FROM Users WHERE role = "Team Member"';
    connection.execute(query, (err, teamMembers) => {
        if (err) throw err;
        console.log(teamMembers);
        res.render('project-manager', { name: req.session.name, teamMembers: teamMembers });
    });
});



router.get('/logout', (req, res) => {
    if (req.session) {
        req.session.destroy((err) => {
            if (err) {
                return res.redirect('/index');
            }
            res.redirect('/login');
        });
    } else {
        res.redirect('/login');
    }
});


module.exports = router;