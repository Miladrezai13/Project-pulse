-- Drop Tables 

DROP TABLE IF EXISTS Users;
DROP TABLE IF EXISTS Projects;
DROP TABLE IF EXISTS ProjectMembers;
DROP TABLE IF EXISTS Reports;


-- Users Table
CREATE TABLE Users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id VARCHAR(255) DEFAULT 'EMP-',
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    mobile_number VARCHAR(20),
    password VARCHAR(255) NOT NULL, 
    role ENUM('Project Manager', 'Team Member') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    registrationToken VARCHAR(255)
);



-- team members for testing 
INSERT INTO Users (employee_id, name, email, mobile_number, password, role) 
VALUES 
('E1001', '123', '123@gmail.com', '123-456-7890', '$2b$10$iM8nFL25mWVvcyG9Ut3MOuM1CQmQSfdSF2/eeL6g8.Ie8WZ6vQkB6', 'Project Manager');

-- DESCRIBE Users;
SELECT * FROM Users;


CREATE TABLE Projects (
    project_id INT AUTO_INCREMENT PRIMARY KEY,
    project_name VARCHAR(255) NOT NULL,
    reporting_frequency VARCHAR(255),
    reporting_date DATE,
    deadline DATE,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
-- ALTER TABLE Projects MODIFY COLUMN date TIME;

SELECT * FROM Projects;



-- DESC Projects;

-- ProjectMembers Table
CREATE TABLE ProjectMembers (
    member_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    project_id INT,
    FOREIGN KEY (user_id) REFERENCES Users(user_id),
    FOREIGN KEY (project_id) REFERENCES Projects(project_id)
);
SELECT * FROM ProjectMembers;

-- Reports Table
CREATE TABLE Reports (
    report_id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT,
    submitted_by INT,
    content TEXT,
    status ENUM('Read', 'Unread') DEFAULT 'Unread',
    submission_date DATE,
     task_id INT,
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES Projects(project_id),
    FOREIGN KEY (submitted_by) REFERENCES Users(user_id)
);


SELECT * FROM Reports;

CREATE TABLE Tasks (
    task_id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT,
    team_member_id INT,
    status ENUM('Pending', 'In Progress', 'Completed') DEFAULT 'Pending',
    due_date DATE,
    deadline_time TIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    task_name VARCHAR(255),
    FOREIGN KEY (project_id) REFERENCES Projects(project_id),
    FOREIGN KEY (team_member_id) REFERENCES Users(user_id)
);

SELECT * FROM Tasks;



