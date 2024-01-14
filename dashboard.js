
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

router.post('/create-project', (req, res) => {

    // Check if the session is valid and if user_id exists in the session
    if (!req.session || !req.session.user_id) {
        return res.status(400).send('User not logged in or session expired');
    }
    const createdBy = req.session.user_id;
    const { projectName, reportingFrequency, reportingDate, deadline, teamMembers } = req.body;
    let teamMembersArray = teamMembers ? teamMembers.split(',').map(str => parseInt(str.trim())).filter(num => Number.isInteger(num)) : [];

    const query = 'INSERT INTO Projects (project_name, reporting_frequency, reporting_date, deadline, created_by) VALUES (?, ?, ?, ?, ?)';
    console.log(projectName, reportingFrequency, reportingDate, deadline, createdBy);


    connection.execute(query, [projectName, reportingFrequency, reportingDate, deadline, createdBy], (err, results) => {
        if (err) throw err;
        const projectId = results.insertId; // get the id of the recently inserted project
        const reportingStartDate = new Date(reportingDate);
        const projectDeadline = new Date(deadline);  // Convert deadline string to a Date object
        let reportDueDates = [];


        switch (reportingFrequency) {
            case 'daily':
                for (let d = new Date(reportingStartDate); d <= projectDeadline; d.setDate(d.getDate() + 1)) {
                    reportDueDates.push(new Date(d));
                }
                break;
            case 'weekly':
                for (let d = new Date(reportingStartDate); d <= projectDeadline; d.setDate(d.getDate() + 7)) {
                    reportDueDates.push(new Date(d));
                }
                break;
            case 'fortnightly':
                for (let d = new Date(reportingStartDate); d <= projectDeadline; d.setDate(d.getDate() + 14)) {
                    reportDueDates.push(new Date(d));
                }
                break;
            case 'monthly':
                for (let d = new Date(reportingStartDate); d <= projectDeadline; d.setMonth(d.getMonth() + 1)) {
                    reportDueDates.push(new Date(d));
                }
                break;
        }

        reportDueDates = reportDueDates.filter(date => {
            const dayOfWeek = date.getDay();
            return dayOfWeek !== 0 && dayOfWeek !== 6; 
        });

        // Inserting tasks for each report due date and for each team member
        const insertTaskQuery = 'INSERT INTO Tasks (team_member_id, project_id, due_date, deadline_time, task_name) VALUES (?, ?, ?, ?, ?)';
        reportDueDates.forEach(dueDate => {
            teamMembersArray.forEach(memberId => {

                connection.execute(insertTaskQuery, [memberId, projectId, dueDate, '17:00:00', 'New Task'], (err, _) => {
                    if (err) console.error(`Error inserting task for memberId ${memberId} for date ${dueDate}: ${err.message}`);
                });
            });
        });

        // Iterate over each team member and insert them into the ProjectMembers table
        const insertMemberQuery = 'INSERT INTO ProjectMembers (user_id, project_id) VALUES (?, ?)';
        let errors = [];
        teamMembersArray.forEach(memberId => {
            console.log("Inserting memberId:", memberId);
            connection.execute(insertMemberQuery, [memberId, projectId], (err, _) => {
                if (err) {
                    console.error("Error inserting member:", memberId, "Error:", err);
                    errors.push(`Error inserting member: ${memberId}. Error: ${err.message}`);
                }
            });
        });

        if (errors.length) {
            return res.status(500).send(errors.join('; '));
        }
        res.redirect('/dashboard');
    });

});


router.post('/mark-report-read', (req, res) => {

    const { reportId } = req.body;
    const query = 'UPDATE Reports SET status = "Read" WHERE report_id = ?';
    connection.execute(query, [reportId], (err, results) => {
        if (err) {
            console.error("Error marking report as read:", err);
            return res.status(500).send('Error marking report as read.');
        }

        res.redirect('/dashboard');
    });
});


router.post('/add-comment', (req, res) => {
    const reportId = req.body.reportId;
    const comment = req.body.comment;

    const query = `UPDATE Reports SET comment = ? WHERE report_id = ?`;
    connection.execute(query, [comment, reportId], (err) => {
        if (err) throw err;
        res.redirect('/dashboard');
    });
});



router.get('/dashboard', (req, res) => {
    console.log("Dashboard route hit");
    const query = `
    SELECT
        Projects.project_name,
        Users.name AS team_member_name,
        Reports.report_id,
        Reports.content,
        Reports.status,
        Reports.comment,
        Reports.submission_date,
        Projects.reporting_frequency,
        Projects.reporting_date,
        Projects.deadline
    FROM Projects
    JOIN ProjectMembers ON Projects.project_id = ProjectMembers.project_id
    JOIN Users ON ProjectMembers.user_id = Users.user_id
    LEFT JOIN Reports ON Projects.project_id = Reports.project_id AND Users.user_id = Reports.submitted_by
    WHERE Projects.created_by = ?
    ORDER BY Reports.submission_date DESC;
`;
    connection.execute(query, [req.session.user_id], (err, results) => {
        if (err) throw err;
        // Convert flat data to nested structure
        const projectsMap = {}; results.forEach(row => {
            if (!projectsMap[row.project_name]) {
                projectsMap[row.project_name] = {
                    project_name: row.project_name,
                    team_members: []
                };
            }

            let teamMember = projectsMap[row.project_name].team_members.find(m => m.name === row.team_member_name);

            if (!teamMember) {
                teamMember = {
                    name: row.team_member_name,
                    reports: []
                };
                projectsMap[row.project_name].team_members.push(teamMember);
            }

            if (row.content) {
                teamMember.reports.push({
                    content: row.content,
                    status: row.status,
                    report_id: row.report_id,
                    comment: row.comment,
                    submission_date: row.submission_date
                });
            }
        });

        const projects = Object.values(projectsMap);
        res.render('dashboard', { projects, name: req.session.name });
    });
});
module.exports = router;
