# MySQL Database Schema Overview

This document provides a clear view of the current database schema used in the **EXAM_MCQ (Exam Portal)** project. The database is named `exam_portal_v2`.

## Tables and Structure

### 1. `teachers`
Stores information about the faculty/teachers who create and manage exams.
| Column | Type | Constraints |
| :--- | :--- | :--- |
| `id` | INT | PRIMARY KEY, AUTO_INCREMENT |
| `username` | VARCHAR(255) | UNIQUE, NOT NULL |
| `email` | VARCHAR(255) | UNIQUE, NOT NULL |
| `password` | VARCHAR(255) | NOT NULL |
| `last_token` | TEXT | |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |

### 2. `students`
Stores student information and authentication details.
| Column | Type | Constraints |
| :--- | :--- | :--- |
| `id` | INT | PRIMARY KEY, AUTO_INCREMENT |
| `username` | VARCHAR(255) | UNIQUE |
| `email` | VARCHAR(255) | UNIQUE |
| `password` | VARCHAR(255) | |
| `prn_number` | VARCHAR(50) | UNIQUE, NOT NULL |
| `last_token` | TEXT | |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |

### 3. `exams`
Contains the details of the examinations.
| Column | Type | Constraints |
| :--- | :--- | :--- |
| `id` | INT | PRIMARY KEY, AUTO_INCREMENT |
| `title` | VARCHAR(255) | NOT NULL |
| `subject` | VARCHAR(255) | NOT NULL |
| `duration` | INT | NOT NULL (in minutes) |
| `scheduled_start` | DATETIME | |
| `total_marks` | INT | NOT NULL |
| `status` | ENUM | 'Draft', 'Published', 'Scheduled', 'Completed' |
| `passing_marks` | INT | NOT NULL |
| `instructions` | TEXT | |
| `teacher_id` | INT | FOREIGN KEY (teachers.id) |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |

### 4. `exam_questions`
Stores individual questions for each exam.
| Column | Type | Constraints |
| :--- | :--- | :--- |
| `id` | INT | PRIMARY KEY, AUTO_INCREMENT |
| `exam_id` | INT | FOREIGN KEY (exams.id) |
| `question` | TEXT | NOT NULL |
| `options` | JSON | NOT NULL (Array of strings) |
| `correct_answer` | INT | NOT NULL (Index 0-3) |
| `marks` | INT | DEFAULT 1 |
| `difficulty` | ENUM | 'Easy', 'Medium', 'High' |

### 5. `exam_results`
Stores the final results of students for each exam.
| Column | Type | Constraints |
| :--- | :--- | :--- |
| `id` | INT | PRIMARY KEY, AUTO_INCREMENT |
| `exam_id` | INT | FOREIGN KEY (exams.id) |
| `student_id` | INT | FOREIGN KEY (students.id) |
| `score` | INT | NOT NULL |
| `total_questions` | INT | NOT NULL |
| `correct_answers` | INT | NOT NULL |
| `completion_time` | INT | NOT NULL (in seconds) |
| `submitted_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |

### 6. `exam_sessions`
Track active exam sessions for proctoring.
| Column | Type | Constraints |
| :--- | :--- | :--- |
| `id` | INT | PRIMARY KEY, AUTO_INCREMENT |
| `student_id` | INT | FOREIGN KEY (students.id) |
| `exam_id` | INT | FOREIGN KEY (exams.id) |
| `start_time` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |
| `end_time` | TIMESTAMP | |
| `warnings_count` | INT | DEFAULT 0 |
| `status` | ENUM | 'active', 'completed', 'terminated' |

### 7. `exam_warnings`
Detailed logs of proctoring violations (e.g., tab-switching, no face detected).
| Column | Type | Constraints |
| :--- | :--- | :--- |
| `id` | INT | PRIMARY KEY, AUTO_INCREMENT |
| `session_id` | INT | FOREIGN KEY (exam_sessions.id) |
| `warning_type` | VARCHAR(100) | e.g., 'tab-switch', 'no-face' |
| `message` | TEXT | |
| `timestamp` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |

### 8. `student_responses`
Tracks individual question-level responses for analytics.
| Column | Type | Constraints |
| :--- | :--- | :--- |
| `id` | INT | PRIMARY KEY, AUTO_INCREMENT |
| `session_id` | INT | FOREIGN KEY (exam_sessions.id) |
| `question_id` | INT | FOREIGN KEY (exam_questions.id) |
| `selected_option` | INT | index of option |
| `time_spent` | INT | in seconds |
| `timestamp` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |

---

> [!NOTE]
> This schema is located in `backend/src/config/schema.sql`.
