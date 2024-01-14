const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');
const crypto = require('crypto');
const csvParser = require('csv-parser');

const nodemailer = require("nodemailer");
const { Readable } = require('stream');



const asyncHandler = fn => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};



let connection;

async function initializeDatabaseConnection() {
    try {
        connection = await mysql.createConnection({
            host: 'localhost',
            user: 'dbadm',
            password: 'P@ssw0rd',
            database: 'pulse',
            "multipleStatements": true
        });
        console.log("Database connected successfully.");
    } catch (error) {
        console.error("Error connecting to the database:", error);
        process.exit(1);
    }
}
initializeDatabaseConnection();


router.get('/register', (req, res) => {
    res.render('register');
});


router.get('/addteam', (req, res) => {
    res.render('addteam');
});

router.get('/reset-password', (req, res) => {
    res.render('reset-password');
});

router.get('/register', (req, res) => {
    res.render('register');
});


const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587, // Use port 587 for non-secure connection
    secure: false,
    auth: {
        user: "add your mail",
        pass: "add your pass key ",
    },
});


router.get('/auth/reset-password/:token', asyncHandler(async (req, res) => {

    const token = req.params.token;
    console.log("Received Token:", token);
    try {
        const [rows, fields] = await connection.execute('SELECT * FROM Users WHERE registrationToken = ?', [token]);

        if (!rows || rows.length === 0) {
            console.error('Unexpected database response:', result);
            return res.status(500).send('Server Error');
        }
        console.log("Database Result:", rows);
        if (rows.length === 0) {
            return res.status(400).send('Invalid registration link');
        }
        res.render('reset-password', { email: rows[0].email });

    } catch (error) {
        console.error(error);
        console.error("Database error:", error);
        res.status(500).send('Server Error');
    }
}));


router.post('/upload', async (req, res) => {
    console.log("Upload route hit");
    let responseSent = false;
    if (!req.files || !req.files.file) {
        return res.status(400).send('No file uploaded');
    }

    let uploadedFile = req.files.file;
    const bufferStream = new Readable();
    bufferStream.push(uploadedFile.data);
    bufferStream.push(null);

    bufferStream.pipe(csvParser())
        .on('data', async (row) => {
            try {
                const { employee_id, name, email, mobile_number } = row;
                const role = 'Team Member';
                const saltRounds = 10;
                const password = await bcrypt.hash('default_password', saltRounds);

                const token = crypto.randomBytes(20).toString('hex');
                const query = 'INSERT INTO Users (employee_id, name, email, mobile_number, password, role, registrationToken) VALUES (?, ?, ?, ?, ?, ?, ?)';
                connection.execute(query, [employee_id, name, email, mobile_number, password, role, token]);

                const link = `http://localhost:8888/auth/reset-password/${token}`;
                const mailOptions = {
                    from: '"pulse@project.com',
                    to: email,
                    subject: "Welcome to Our Platfor",
                    text: `Thank you for registering! To set your password, please visit the following link: ${link}`,
                };

                transporter.sendMail(mailOptions, (error, info) => {
                    if (error) {
                        return console.log(error);
                    }
                    console.log('Email sent: ' + info.response);
                });
            } catch (error) {
                console.error(error);
                if (!responseSent) {
                    responseSent = true;
                    res.status(500).json({ message: error.message });

                }
            }
        })
        .on('end', () => {
            if (!responseSent) {
                res.json({ message: 'File has been uploaded and processed.' });

            }
        });
});



router.post('/auth/reset-password', async (req, res) => {
    try {
        const { email, password, password_confirm } = req.body;
        // Check if passwords match
        if (!password || !password_confirm || password.trim() !== password_confirm.trim()) {
            return res.status(400).send('Passwords do not match');
        }
        // Hash the password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        const query = 'UPDATE Users SET password = ? WHERE email = ?';
        await connection.execute(query, [hashedPassword, email]);

        res.redirect('/login');
    } catch (error) {
        console.error(error);
        res.status(500).send(error.message);
    }
});

router.get('/getUsers', async (req, res) => {
    try {
        const [users] = await connection.execute('SELECT name, email, role FROM Users');
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


module.exports = router;