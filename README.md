# ⚛️ React Advanced Authentication & Role Management System

โปรเจกต์นี้เป็น Web Application เต็มรูปแบบที่พัฒนาด้วย **React + Vite** ร่วมกับระบบ Backend (Node.js/Express) เน้นการจัดการสิทธิ์ผู้ใช้งาน (Role-based Authentication), การจัดการ State ด้วย **Redux Toolkit**, และการทดสอบระบบอย่างครอบคลุมผ่าน **Playwright**

## ✨ คุณสมบัติหลัก (Features)

- **🔐 ระบบ Authentication ครบวงจร:** - เข้าสู่ระบบ (Login) / สมัครสมาชิก (Register)
  - ลืมรหัสผ่าน / ตั้งรหัสผ่านใหม่ (Reset Password)
  - ยืนยันตัวตนผ่านอีเมล (Check Code)
- **🛡️ Protected & Guest Routes:** - ป้องกันการเข้าถึงหน้าเว็บสำหรับผู้ที่ยังไม่เข้าระบบ (เช่น `/settings`, `/admin`)
  - ป้องกันผู้ที่เข้าสู่ระบบแล้วไม่ให้กลับไปหน้า Login/Register โดยไม่จำเป็น (`GuestRoute`)
- **👑 Role-based Access Control (RBAC):** - การแยกหน้า Dashboard ตามสิทธิ์ผู้ใช้งาน (`admin` vs `user`)
- **📦 State Management:** - จัดการข้อมูล User และ Token แบบ Global ด้วย Redux Toolkit (`authSlice.js`)
- **🧪 Automated E2E Testing:**
  - ทดสอบการทำงานของ Frontend เสมือนผู้ใช้จริงด้วย Playwright

---

## 🛠️ เทคโนโลยีที่ใช้ (Tech Stack)

### Frontend
- **Framework:** React 18, Vite
- **State Management:** Redux Toolkit (`react-redux`, `@reduxjs/toolkit`)
- **Routing:** React Router DOM v6
- **Styling:** CSS (Custom Styles), Responsive Design
- **API Client:** Axios หรือ Fetch API แบบ Custom (`src/api.js`)
- **Testing:** Playwright

### Backend (อ้างอิงจากโฟลเดอร์ /backend)
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB (Mongoose)
- **Authentication:** JWT (JSON Web Tokens)
- **Testing:** Jest & Supertest

---

## 📂 โครงสร้างโปรเจกต์ (Project Structure)

\`\`\`text
react/
├── backend/                   # Node.js Express API
│   ├── __tests__/             # Jest Test Cases
│   ├── models/                # Mongoose Schemas
│   ├── routes/                # API Endpoints
│   └── server.js              # Entry point ของ Backend
│
└── frontend/                  # React Vite Application
    ├── public/                # Static assets (Images, Favicon)
    ├── src/
    │   ├── components/        # Reusable Components (Layout, GuestRoute, ProtectedRoute)
    │   ├── pages/             # Page Components (HomePage, AdminPage, LoginPage, ฯลฯ)
    │   ├── slices/            # Redux Slices (เช่น authSlice.js)
    │   ├── api.js             # การตั้งค่า Axios/Fetch API Interceptors
    │   ├── store.js           # การตั้งค่า Redux Store
    │   ├── App.jsx            # Setup React Router
    │   └── main.jsx           # Entry point ของ React
    ├── tests/                 # Playwright E2E Tests
    │   ├── auth/              # เทสต์ระบบ Login/Register
    │   └── protected/         # เทสต์ระบบจำกัดสิทธิ์
    ├── package.json
    └── vite.config.js
\`\`\`

---

## 🚀 วิธีการติดตั้งและรันโปรเจกต์

### 1. การเตรียมความพร้อม (Prerequisites)
- Node.js (v18 ขึ้นไป)
- MongoDB (รันในเครื่องหรือใช้ MongoDB Atlas)

### 2. การตั้งค่า Backend
1. เข้าไปที่โฟลเดอร์ \`backend\`
   \`\`\`bash
   cd backend
   npm install
   \`\`\`
2. คัดลอกไฟล์ Environment และตั้งค่าตัวแปร
   \`\`\`bash
   cp .env.example .env
   \`\`\`
   *(แก้ไขไฟล์ `.env` ให้ตรงกับฐานข้อมูลและการตั้งค่า JWT ของคุณ)*
3. เริ่มต้น Server
   \`\`\`bash
   npm run dev
   \`\`\`
   *(Backend จะทำงานที่ `http://localhost:5000`)*

### 3. การตั้งค่า Frontend
1. เปิด Terminal ใหม่และเข้าไปที่โฟลเดอร์ \`frontend\`
   \`\`\`bash
   cd frontend
   npm install
   \`\`\`
2. เริ่มต้น Vite Development Server
   \`\`\`bash
   npm run dev
   \`\`\`
   *(Frontend จะทำงานที่ `http://localhost:5173`)*

---

## 🧪 การทดสอบระบบ (Testing)

โปรเจกต์นี้มีการทดสอบสองระดับ:

### การทดสอบ Backend (Integration Tests)
ใช้ Jest และ Supertest สำหรับทดสอบ API Endpoints
\`\`\`bash
cd backend
npm test
\`\`\`

### การทดสอบ Frontend (End-to-End Tests)
ใช้ Playwright ในการจำลองการคลิกและการทำงานของผู้ใช้บนเบราว์เซอร์
\`\`\`bash
cd frontend
# ติดตั้งเบราว์เซอร์สำหรับการทดสอบครั้งแรก
npx playwright install
# รันเทสต์แบบ Command Line
npx playwright test
# รันเทสต์แบบมี UI ให้ดู
npx playwright test --ui
\`\`\`

---

## 👤 บัญชีสำหรับทดสอบ (Test Accounts)

หากต้องการทดสอบระบบเบื้องต้น สามารถใช้ข้อมูลต่อไปนี้ (ถ้าคุณได้ทำการ Seed Database ไว้):
- **Admin:** `admin@test.com` | รหัสผ่าน: `123456`
- **User:** `user@test.com` | รหัสผ่าน: `123456`

---
*Developed as part of the React advanced development course.*