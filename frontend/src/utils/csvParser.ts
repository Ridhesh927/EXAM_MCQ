/**
 * CSV Parser Utility for Bulk User Uploads
 * Parses CSV files for student and teacher bulk uploads
 */

export interface StudentCSVRow {
    username: string;
    email: string;
    password: string;
    prn_number: string;
}

export interface TeacherCSVRow {
    username: string;
    email: string;
    password: string;
}

/**
 * Parse CSV text into array of objects
 */
export function parseCSV<T>(csvText: string): T[] {
    const lines = csvText.trim().split('\n');

    if (lines.length < 2) {
        throw new Error('CSV file must contain header row and at least one data row');
    }

    // Parse header
    const headers = lines[0].split(',').map(h => h.trim());

    // Parse data rows
    const data: T[] = [];
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue; // Skip empty lines

        const values = line.split(',').map(v => v.trim());

        if (values.length !== headers.length) {
            throw new Error(`Row ${i + 1} has ${values.length} columns, expected ${headers.length}`);
        }

        const row: any = {};
        headers.forEach((header, index) => {
            row[header] = values[index];
        });

        data.push(row as T);
    }

    return data;
}

/**
 * Validate student CSV data
 */
export function validateStudentData(students: StudentCSVRow[]): {
    valid: StudentCSVRow[];
    invalid: Array<{ row: number; data: StudentCSVRow; errors: string[] }>;
} {
    const valid: StudentCSVRow[] = [];
    const invalid: Array<{ row: number; data: StudentCSVRow; errors: string[] }> = [];

    students.forEach((student, index) => {
        const errors: string[] = [];

        // Check required fields
        if (!student.username || student.username.trim() === '') {
            errors.push('Username is required');
        }
        if (!student.email || student.email.trim() === '') {
            errors.push('Email is required');
        } else if (!isValidEmail(student.email)) {
            errors.push('Invalid email format');
        }
        if (!student.password || student.password.trim() === '') {
            errors.push('Password is required');
        } else if (student.password.length < 6) {
            errors.push('Password must be at least 6 characters');
        }
        if (!student.prn_number || student.prn_number.trim() === '') {
            errors.push('PRN number is required');
        }

        if (errors.length > 0) {
            invalid.push({ row: index + 2, data: student, errors }); // +2 for header and 0-index
        } else {
            valid.push(student);
        }
    });

    return { valid, invalid };
}

/**
 * Validate teacher CSV data
 */
export function validateTeacherData(teachers: TeacherCSVRow[]): {
    valid: TeacherCSVRow[];
    invalid: Array<{ row: number; data: TeacherCSVRow; errors: string[] }>;
} {
    const valid: TeacherCSVRow[] = [];
    const invalid: Array<{ row: number; data: TeacherCSVRow; errors: string[] }> = [];

    teachers.forEach((teacher, index) => {
        const errors: string[] = [];

        // Check required fields
        if (!teacher.username || teacher.username.trim() === '') {
            errors.push('Username is required');
        }
        if (!teacher.email || teacher.email.trim() === '') {
            errors.push('Email is required');
        } else if (!isValidEmail(teacher.email)) {
            errors.push('Invalid email format');
        }
        if (!teacher.password || teacher.password.trim() === '') {
            errors.push('Password is required');
        } else if (teacher.password.length < 6) {
            errors.push('Password must be at least 6 characters');
        }

        if (errors.length > 0) {
            invalid.push({ row: index + 2, data: teacher, errors }); // +2 for header and 0-index
        } else {
            valid.push(teacher);
        }
    });

    return { valid, invalid };
}

/**
 * Simple email validation
 */
function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Read CSV file from input element
 */
export function readCSVFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            const text = e.target?.result as string;
            resolve(text);
        };

        reader.onerror = () => {
            reject(new Error('Failed to read file'));
        };

        reader.readAsText(file);
    });
}

/**
 * Download CSV template
 */
export function downloadTemplate(type: 'student' | 'teacher') {
    const filename = type === 'student' ? 'student_template.csv' : 'teacher_template.csv';
    const link = document.createElement('a');
    link.href = `/${filename}`;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
