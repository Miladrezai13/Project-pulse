"use strict";
const express = require('express');
const app = express();
const path = require('path');
const cors = require('cors');
const fileUpload = require('express-fileupload');
const bodyParser = require('body-parser');
const ejs = require('ejs');

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'view'));


app.use(fileUpload());
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('view'));
app.use(express.static('public'));



app.use((req, res, next) => {
    res.locals.one = true;
    next();
});



const session = require('express-session');
app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false, maxAge: 600000 }
}));



const pulseRoutes = require('./pulse');
app.use(pulseRoutes);

const dashboardRoutes = require('./dashboard');
app.use(dashboardRoutes);

const nodemailerRoutes = require('./nodemailer');
app.use(nodemailerRoutes);

const teamdashboardRoutes = require('./teamdashboard');
app.use(teamdashboardRoutes);



const PORT = 8888;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}/index`);
});

module.exports = app;

