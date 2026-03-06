const examController = require('./src/controllers/examController');
const { pool } = require('./src/config/db');

async function test() {
    let connection;
    try {
        connection = await pool.getConnection();
        const [exams] = await connection.query('SELECT id, teacher_id FROM exams LIMIT 1');
        if (exams.length === 0) {
            console.log("No exams found to test editing.");
            process.exit(0);
        }

        const examId = exams[0].id.toString();
        const teacherId = exams[0].teacher_id;

        console.log(`Simulating Edit for Exam ${examId} with Teacher ${teacherId}`);

        const req = {
            params: { id: examId },
            user: { id: teacherId },
            body: {
                title: "Simulated Debug Exam",
                subject: "Debugging",
                duration: 60,
                passing_marks: 40,
                target_department: "Computer Science (CSE)",
                target_year: "First Year",
                status: "Published",
                questions: [
                    {
                        text: "Dummy question?",
                        options: ["A", "B", "C", "D"],
                        correct: 0,
                        marks: 5,
                        difficulty: "medium"
                    }
                ]
            }
        };
        const res = {
            json: (data) => console.log("RESPONSE JSON:", data),
            status: (code) => { console.log("RESPONSE STATUS:", code); return res; }
        };

        await examController.updateExam(req, res);
    } catch (e) {
        console.log("SCRIPT CAUGHT ERROR:", e.message);
    } finally {
        if (connection) connection.release();
        setTimeout(() => process.exit(0), 1000);
    }
}
test();
