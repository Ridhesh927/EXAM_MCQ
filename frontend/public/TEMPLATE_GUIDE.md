# CSV Template Usage Guide

## Student Upload Template

**File:** `student_template.csv`

### Required Columns:
- `username` - Unique username for the student
- `email` - Unique email address (must be valid format)
- `password` - Plain text password (will be hashed automatically)
- `prn_number` - Unique PRN/Roll number

### Example:
```csv
username,email,password,prn_number
john_doe,john.doe@school.com,Student@123,PRN2024001
jane_smith,jane.smith@school.com,Student@123,PRN2024002
```

### Important Notes:
- All fields are **required**
- Email and PRN must be **unique** across all students
- Password will be **hashed** with bcrypt before storage
- Duplicate entries will be reported in the failed results

---

## Teacher Upload Template

**File:** `teacher_template.csv`

### Required Columns:
- `username` - Unique username for the teacher
- `email` - Unique email address (must be valid format)
- `password` - Plain text password (will be hashed automatically)

### Example:
```csv
username,email,password
prof_anderson,anderson@school.com,Teacher@123
prof_martinez,martinez@school.com,Teacher@123
```

### Important Notes:
- All fields are **required**
- Email must be **unique** across all teachers
- Password will be **hashed** with bcrypt before storage
- Duplicate entries will be reported in the failed results

---

## How to Use

### 1. Download Template
- Download `student_template.csv` or `teacher_template.csv`
- Open in Excel, Google Sheets, or any CSV editor

### 2. Fill in Data
- Replace sample data with actual user information
- Keep the header row intact
- Ensure all required fields are filled

### 3. Upload via Admin Panel
- Login as a teacher/admin
- Navigate to "Manage Students" or "Manage Teachers"
- Click "Bulk Upload" button
- Select your CSV file
- Review results (success/failed)

### 4. Review Results
The system will return:
- **Success:** List of created users with their IDs
- **Failed:** List of entries that failed with error reasons

---

## Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| "Missing required fields" | Empty cells in CSV | Fill all required columns |
| "Email already exists" | Duplicate email in database | Use unique email addresses |
| "PRN already exists" | Duplicate PRN in database | Use unique PRN numbers |
| "Invalid email format" | Malformed email | Use valid email format |

---

## Tips for Large Uploads

1. **Test with small batch first** - Upload 5-10 users to verify format
2. **Check for duplicates** - Ensure no duplicate emails/PRNs in your CSV
3. **Use consistent passwords** - Consider using a default password that users change on first login
4. **Keep backups** - Save your CSV file before uploading
5. **Review failed entries** - Fix errors and re-upload failed entries

---

## API Endpoints (For Developers)

### Bulk Student Upload
```
POST /api/admin/bulk-students
Authorization: Bearer <token>
Content-Type: application/json

{
  "students": [
    {
      "username": "john_doe",
      "email": "john@school.com",
      "password": "Student@123",
      "prn_number": "PRN2024001"
    }
  ]
}
```

### Bulk Teacher Upload
```
POST /api/admin/bulk-teachers
Authorization: Bearer <token>
Content-Type: application/json

{
  "teachers": [
    {
      "username": "prof_anderson",
      "email": "anderson@school.com",
      "password": "Teacher@123"
    }
  ]
}
```
