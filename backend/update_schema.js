const { pool } = require('./src/config/db');

async function update() {
    try {
        // ---- Exams table updates ----
        const [desc] = await pool.query('DESCRIBE exams');
        const hasStatus = desc.some(c => c.Field === 'status');

        if (hasStatus) {
            await pool.query("ALTER TABLE exams MODIFY COLUMN status ENUM('Draft', 'Published', 'Scheduled', 'Completed') DEFAULT 'Published'");
            console.log("Schema modified status column");
        } else {
            await pool.query("ALTER TABLE exams ADD COLUMN status ENUM('Draft', 'Published', 'Scheduled', 'Completed') DEFAULT 'Published'");
            console.log("Schema added status column");
        }

        // Ensure scheduled_start exists
        const hasScheduledStart = desc.some(c => c.Field === 'scheduled_start');
        if (!hasScheduledStart) {
            await pool.query("ALTER TABLE exams ADD COLUMN scheduled_start DATETIME");
            console.log("Schema added scheduled_start column");
        }

        // Ensure target_department exists
        const hasTargetDept = desc.some(c => c.Field === 'target_department');
        if (!hasTargetDept) {
            await pool.query("ALTER TABLE exams ADD COLUMN target_department VARCHAR(255) DEFAULT NULL");
            console.log("Schema added target_department column to exams");
        } else {
            console.log("Column target_department already exists in exams");
        }

        // Ensure target_year exists
        const hasTargetYear = desc.some(c => c.Field === 'target_year');
        if (!hasTargetYear) {
            await pool.query("ALTER TABLE exams ADD COLUMN target_year VARCHAR(50) DEFAULT NULL");
            console.log("Schema added target_year column to exams");
        } else {
            console.log("Column target_year already exists in exams");
        }

        // ---- Students table updates ----
        const [studentDesc] = await pool.query('DESCRIBE students');

        const hasDepartment = studentDesc.some(c => c.Field === 'department');
        if (!hasDepartment) {
            await pool.query("ALTER TABLE students ADD COLUMN department VARCHAR(255) DEFAULT NULL");
            console.log("Schema added department column to students");
        } else {
            console.log("Column department already exists in students");
        }

        const hasYear = studentDesc.some(c => c.Field === 'year');
        if (!hasYear) {
            await pool.query("ALTER TABLE students ADD COLUMN year VARCHAR(50) DEFAULT NULL");
            console.log("Schema added year column to students");
        } else {
            console.log("Column year already exists in students");
        }

        const hasIsBlocked = studentDesc.some(c => c.Field === 'is_blocked');
        if (!hasIsBlocked) {
            await pool.query("ALTER TABLE students ADD COLUMN is_blocked BOOLEAN DEFAULT FALSE");
            console.log("Schema added is_blocked column to students");
        } else {
            console.log("Column is_blocked already exists in students");
        }

        // ---- Exam Results table updates ----
        const [resultsDesc] = await pool.query('DESCRIBE exam_results');
        const resultsColumns = resultsDesc.map(c => c.Field);

        if (!resultsColumns.includes('total_questions')) {
            await pool.query("ALTER TABLE exam_results ADD COLUMN total_questions INT NOT NULL DEFAULT 0");
            console.log("Schema added total_questions column to exam_results");
        }
        if (!resultsColumns.includes('correct_answers')) {
            await pool.query("ALTER TABLE exam_results ADD COLUMN correct_answers INT NOT NULL DEFAULT 0");
            console.log("Schema added correct_answers column to exam_results");
        }
        if (!resultsColumns.includes('total_marks')) {
            await pool.query("ALTER TABLE exam_results ADD COLUMN total_marks INT NOT NULL DEFAULT 0");
            console.log("Schema added total_marks column to exam_results");
        }
        if (!resultsColumns.includes('completion_time')) {
            await pool.query("ALTER TABLE exam_results ADD COLUMN completion_time INT NOT NULL DEFAULT 0");
            console.log("Schema added completion_time column to exam_results");
        }
        if (!resultsColumns.includes('submitted_at')) {
            await pool.query("ALTER TABLE exam_results ADD COLUMN submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP");
            console.log("Schema added submitted_at column to exam_results");
        }

        // --- Students Table Updates ---
        const [studentCols] = await pool.query("SHOW COLUMNS FROM students");
        const studentColumnNames = studentCols.map(c => c.Field);
        
        if (!studentColumnNames.includes('resume_text')) {
            await pool.query("ALTER TABLE students ADD COLUMN resume_text LONGTEXT DEFAULT NULL");
            console.log("Schema added resume_text column to students");
        }
        if (!studentColumnNames.includes('parsed_skills')) {
            await pool.query("ALTER TABLE students ADD COLUMN parsed_skills JSON DEFAULT NULL");
            console.log("Schema added parsed_skills column to students");
        }

        // --- Coding Interviews table updates ---
        const [codingDesc] = await pool.query('DESCRIBE coding_interviews');
        const codingColumns = codingDesc.map(c => c.Field);

        if (!codingColumns.includes('completion_time_seconds')) {
            await pool.query("ALTER TABLE coding_interviews ADD COLUMN completion_time_seconds INT DEFAULT 0");
            console.log("Schema added completion_time_seconds column to coding_interviews");
        }
        if (!codingColumns.includes('submitted_at')) {
            await pool.query("ALTER TABLE coding_interviews ADD COLUMN submitted_at TIMESTAMP NULL DEFAULT NULL");
            console.log("Schema added submitted_at column to coding_interviews");
        }

        // --- New Interview Tables ---
        await pool.query(`
            CREATE TABLE IF NOT EXISTS interviews (
                id INT AUTO_INCREMENT PRIMARY KEY,
                student_id INT,
                job_role_target VARCHAR(255) NOT NULL,
                total_score INT DEFAULT 0,
                ai_feedback TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (student_id) REFERENCES students (id) ON DELETE CASCADE
            )
        `);
        console.log("Schema ensured interviews table exists");

        await pool.query(`
            CREATE TABLE IF NOT EXISTS interview_questions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                interview_id INT,
                question TEXT NOT NULL,
                options JSON NOT NULL,
                correct_answer VARCHAR(255) NOT NULL,
                student_answer VARCHAR(255),
                explanation TEXT,
                FOREIGN KEY (interview_id) REFERENCES interviews (id) ON DELETE CASCADE
            )
        `);
        console.log("Schema ensured interview_questions table exists");

        console.log("\nAll schema updates completed successfully!");
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
update();
