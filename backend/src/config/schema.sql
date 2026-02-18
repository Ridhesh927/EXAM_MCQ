CREATE DATABASE IF NOT EXISTS exam_portal_v2;

USE exam_portal_v2;

-- Teachers Table
CREATE TABLE IF NOT EXISTS teachers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    last_token TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Students Table
CREATE TABLE IF NOT EXISTS students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) UNIQUE,
    email VARCHAR(255) UNIQUE,
    password VARCHAR(255),
    prn_number VARCHAR(50) NOT NULL UNIQUE,
    last_token TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Exams Table
CREATE TABLE IF NOT EXISTS exams (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    duration INT NOT NULL, -- in minutes
    scheduled_start DATETIME,
    total_marks INT NOT NULL,
    status ENUM(
        'Draft',
        'Published',
        'Completed'
    ) DEFAULT 'Published',
    passing_marks INT NOT NULL,
    instructions TEXT,
    teacher_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (teacher_id) REFERENCES teachers (id) ON DELETE CASCADE
);

-- Exam Questions Table
CREATE TABLE IF NOT EXISTS exam_questions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    exam_id INT,
    question TEXT NOT NULL,
    options JSON NOT NULL, -- Array of strings
    correct_answer INT NOT NULL, -- Index 0-3
    marks INT DEFAULT 1,
    difficulty ENUM('Easy', 'Medium', 'High') DEFAULT 'Medium',
    FOREIGN KEY (exam_id) REFERENCES exams (id) ON DELETE CASCADE
);

-- Exam Results Table
CREATE TABLE IF NOT EXISTS exam_results (
    id INT AUTO_INCREMENT PRIMARY KEY,
    exam_id INT,
    student_id INT,
    score INT NOT NULL,
    total_questions INT NOT NULL,
    correct_answers INT NOT NULL,
    completion_time INT NOT NULL, -- in seconds
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (exam_id) REFERENCES exams (id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students (id) ON DELETE CASCADE
);

-- Student Sessions (for proctoring/tracking)
CREATE TABLE IF NOT EXISTS exam_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT,
    exam_id INT,
    start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP NULL,
    warnings_count INT DEFAULT 0,
    status ENUM(
        'active',
        'completed',
        'terminated'
    ) DEFAULT 'active',
    FOREIGN KEY (student_id) REFERENCES students (id) ON DELETE CASCADE,
    FOREIGN KEY (exam_id) REFERENCES exams (id) ON DELETE CASCADE
);

-- Detailed Warnings Log
CREATE TABLE IF NOT EXISTS exam_warnings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id INT,
    warning_type VARCHAR(100), -- 'tab-switch', 'multiple-faces', 'no-face', 'fullscreen-exit', 'talking'
    message TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES exam_sessions (id) ON DELETE CASCADE
);

-- Individual Question Responses (for detailed tracking)
CREATE TABLE IF NOT EXISTS student_responses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id INT,
    question_id INT,
    selected_option INT, -- Index of option
    time_spent INT, -- in seconds for this question
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES exam_sessions (id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES exam_questions (id) ON DELETE CASCADE
);