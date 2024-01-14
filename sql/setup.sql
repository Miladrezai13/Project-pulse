SELECT USER();
SHOW DATABASES;


-- DROP USER IF EXISTS 'pulse'@'localhost';



-- CREATE USER 'pulse'@'localhost'
-- IDENTIFIED BY 'P@ssw0rd';

-- GRANT ALL PRIVILEGES
-- ON *.* TO 'pulse'@'localhost'
-- WITH GRANT OPTION;

DROP DATABASE IF EXISTS pulse;


CREATE DATABASE IF NOT EXISTS pulse;

SHOW DATABASES;
USE pulse;

SHOW DATABASES LIKE "%pulse%";

