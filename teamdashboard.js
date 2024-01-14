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



router.get('/teamdashboard', (req, res) => {
    // Ensure user is logged in
    if (!req.session.user_id) {
        return res.redirect('/login');
    }

    const query = `SELECT
   Users.name AS team_member_name,
    Reports.report_id,
    Projects.project_name,
    Projects.reporting_frequency,
    Projects.reporting_date,
    Projects.deadline,
    Projects.project_id,
    Reports.content AS report_content,
    Reports.submission_date AS report_submission_date,
    Reports.status AS report_status,
    Tasks.due_date,
    Tasks.deadline_time,
    Tasks.task_id,
    Tasks.status AS task_status,
    Reports.comment
FROM ProjectMembers
JOIN Projects ON ProjectMembers.project_id = Projects.project_id
JOIN Users ON ProjectMembers.user_id = Users.user_id
LEFT JOIN Reports ON Projects.project_id = Reports.project_id AND Users.user_id = Reports.submitted_by
LEFT JOIN Tasks ON Projects.project_id = Tasks.project_id AND Users.user_id = Tasks.team_member_id
WHERE ProjectMembers.user_id = ?;
`;


    connection.execute(query, [req.session.user_id], (err, rows) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).send('Database error');
        }

        let teamMemberName = rows[0] ? rows[0].team_member_name : 'Unknown Member';

        let projects = [];
        let projectIds = new Set();

        rows.forEach(row => {
            if (!projectIds.has(row.project_id)) {
                projectIds.add(row.project_id);
                projects.push({
                    project_name: row.project_name,
                    reporting_frequency: row.reporting_frequency,
                    reporting_date: row.reporting_date,
                    deadline: row.deadline,
                    project_id: row.project_id,
                    tasks: [],
                    reports: []
                });
            }

            if (row.report_content) {
                let project = projects.find(p => p.project_id === row.project_id);
                if (!project.reports.some(report => report.content === row.report_content)) {
                    project.reports.push({
                        content: row.report_content,
                        submission_date: row.report_submission_date,
                        status: row.report_status,
                        comment: row.comment
                    });
                }
            }


            if (row.due_date) {
                let project = projects.find(p => p.project_id === row.project_id);
                if (!project.tasks.some(t => t.task_id === row.task_id)) {
                    let fullDueDate = new Date(row.due_date);
                    const [hours, minutes] = row.deadline_time.split(':').map(Number);
                    fullDueDate.setHours(hours, minutes);
                    project.tasks.push({
                        due_date: fullDueDate,
                        task_id: row.task_id,
                        status: row.task_status,
                        report_id: row.report_id,
                    });
                }
            }

        });

        res.render('teamdashboard', {
            projects: projects,
            teamMemberName: teamMemberName
        });
    });
});



router.post('/submit-report', (req, res) => {
    console.log(req.body);

    // Ensure user is logged in
    if (!req.session.user_id) {
        return res.status(401).send('Please login to submit a report');
    }

    const { content, projectId, taskId } = req.body;
    if (!content || !projectId || !taskId) {
        return res.status(400).send('Content, Project ID, and Task ID are required');
    }

    const query = `
    INSERT INTO Reports (project_id, task_id, submitted_by, content, submission_date)
    VALUES (?, ?, ?, ?, NOW())
    `;

    connection.execute(query, [projectId, taskId, req.session.user_id, content], (err, results) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).send('Database error');
        }
        const updateTaskStatusQuery = `
        UPDATE Tasks SET status = 'Completed' WHERE task_id = ?
    `;

        connection.execute(updateTaskStatusQuery, [taskId], (err, updateResults) => {
            if (err) {
                console.error("Database error:", err);
                return res.status(500).send('Database error while updating task status.');
            }

            res.redirect('/teamdashboard');
        });
    });
});

module.exports = router;