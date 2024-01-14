## readme.md

---

# Project pulse

A simple project management system to manage projects, assign tasks to team members, mark reports as read, and add comments to reports.

## Endpoints

1. **POST /create-project**
    - **Purpose**: Create a new project.
    - **Parameters**: 
      - `projectName`: Name of the project.
      - `reportingFrequency`: Reporting frequency for the project (daily, weekly, fortnightly, or monthly).
      - `reportingDate`: Starting date for the report.
      - `deadline`: Deadline for the project.
      - `teamMembers`: The members will work on project.
    

2. **POST /mark-report-read**
    - **Purpose**: Mark a report as "Read".


3. **POST /add-comment**
    - **Purpose**: Add a comment to a report.

4. **GET /dashboard**
    - **Purpose**: Retrieve and display a dashboard with project details.
    - **Response**: Renders a `dashboard` view with a list of projects and their associated reports.

## Setup

### Dependencies:

- **express**: Web application framework.
- **nodemailer**: automatic email notification.
- **bcrypt**: Password hashing library.
- **mysql2**: MySQL client for Node.js with focus on performance.

### Database Configuration:

The system assumes a database configuration as follows:

- **Host**: `localhost`
- **User**: `dbadm`
- **Password**: `P@ssw0rd`
- **Database**: `pulse`
- **MultipleStatements**: `true`

## Development Notes:
- The username and password for the admin is 
123@gmail.com
1234qwer
- Ensure that you have MySQL server running and the required database and tables set up.
- All routes ensure that a user is authenticated through session. Ensure to have a session middleware in place for the Express app.
---

