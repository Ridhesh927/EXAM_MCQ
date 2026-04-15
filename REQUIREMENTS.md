# 📋 Project Installation Requirements

Since this is a full-stack JavaScript project, the primary "requirements" are managed via `npm`. Below is the summary of what you need to install.

---

## 🛠️ System Prerequisites
- **Node.js**: v18.0.0 or higher
- **NPM**: v9.0.0 or higher
- **MySQL**: v8.0 or higher (with a database named `exam_portal_v2`)
- **Web Browser**: Chrome/Edge (recommended for Webcam & Speech support)

---

## 🗄️ Database Setup
1. Create a MySQL database named `exam_portal_v2`.
2. Configure your credentials in `backend/.env`.
3. Run the schema initializer:
   ```bash
   cd backend
   node update_schema.js
   ```
4. Create a default administrator account:
   ```bash
   node setupDefaultAdmin.js
   ```
   *This will create an admin (id=0) who can manage teachers and global settings.*

---

## 📦 Backend Dependencies (Install in `./backend`)
Run: `cd backend && npm install`

**Core Framework:**
- `express`: Web server framework.
- `mysql2`: MySQL database driver.
- `socket.io`: Real-time bidirectional communication.
- `dotenv`: Environment variable management.

**AI & File Parsing:**
- `groq-sdk`: Interface for Llama 3.3 models.
- `@google/generative-ai`: Interface for Gemini 1.5.
- `pdf-parse` / `mammoth` / `xlsx`: Parsing syllabus files (PDF, Docx, Excel).
- `tesseract.js`: OCR for image-based question papers.

**Security & Utils:**
- `jsonwebtoken` / `bcryptjs`: Authentication and password hashing.
- `helmet` / `cors`: API security headers.
- `multer`: File upload handling.

---

## 💻 Frontend Dependencies (Install in `./frontend`)
Run: `cd frontend && npm install`

**Core UI:**
- `react` / `react-dom` (v19): Component framework.
- `framer-motion`: Premium animations and transitions.
- `lucide-react`: Icon library.
- `recharts`: Analytics and health monitoring charts.

**Integrated IDE & Tools:**
- `@monaco-editor/react`: Integrated coding IDE.
- `jspdf` / `html2canvas`: Certificate generation.
- `qrcode`: Verification codes for certificates.
- `face-api.js`: Client-side proctoring logic.
- `socket.io-client`: Real-time proctoring connection.

---

## 🔑 Required API Keys
You will need to obtain these and place them in `backend/.env`:
1.  **Groq API Keys**: (At least 1-3 keys from https://console.groq.com/)
2.  **Gemini API Key**: (From Google AI Studio)
