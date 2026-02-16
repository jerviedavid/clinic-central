# 🏥 Clinic Central

![Clinic Central Banner](preview/logo.png)

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Visit%20Site-blue?style=for-the-badge&logo=vercel)](https://clinic-central.vercel.app)
[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com)
[![React](https://img.shields.io/badge/React-19.1.1-61DAFB?style=for-the-badge&logo=react)](https://reactjs.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5.22.0-2D3748?style=for-the-badge&logo=prisma)](https://www.prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4.1.12-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

> 🚀 **Live Application**: [clinic-central.vercel.app](https://clinic-central.vercel.app)

**Clinic Central - Doctor, Receptionist, Prescription, Medicine and Patient Management System** - A modern, secure, and feature-rich clinic management system built with React 19, Node.js/Express, Prisma, and Tailwind CSS. Streamline your healthcare operations with comprehensive patient management, appointment scheduling, prescription management, billing systems, and role-based access control.

## 🛠️ Tech Stack

Our clinic management system is built with cutting-edge technologies to ensure performance, security, and scalability:

### **Frontend Technologies**
![React](https://img.shields.io/badge/React-19.1.1-61DAFB?style=for-the-badge&logo=react)
![Vite](https://img.shields.io/badge/Vite-7.1.2-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.1.12-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)

### **Backend & Database**
![Express](https://img.shields.io/badge/Express-5.2.1-000000?style=for-the-badge&logo=express&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-5.22.0-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-003B57?style=for-the-badge&logo=sqlite&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)

### **Development Tools**
![ESLint](https://img.shields.io/badge/ESLint-9.33.0-4B32C3?style=for-the-badge&logo=eslint&logoColor=white)
![PostCSS](https://img.shields.io/badge/PostCSS-8.5.6-DD3A0A?style=for-the-badge&logo=postcss&logoColor=white)
![Git](https://img.shields.io/badge/Git-F05032?style=for-the-badge&logo=git&logoColor=white)
![npm](https://img.shields.io/badge/npm-CB3837?style=for-the-badge&logo=npm&logoColor=white)

### **Deployment & Hosting**
![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)
![GitHub](https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white)

## ✨ Features

### 🔐 **Authentication & Security**
- **JWT Authentication** with email/password
- **Secure Password Hashing** with bcrypt
- **Password Reset** functionality
- **Role-Based Access Control** (Doctor, Receptionist, Admin, Super Admin)
- **Protected Routes** for unauthorized access prevention
- **HTTP-only Cookies** for token storage

### 👨‍⚕️ **Doctor Dashboard**
- **Real-time Statistics** (appointments, waiting patients, prescriptions)
- **Appointment Management** with patient details
- **Prescription Creation & Management**
- **Medicine Database** with search and filtering
- **Patient Queue Management** with token system
- **Prescription History** and editing capabilities

### 🏥 **Receptionist Dashboard**
- **Appointment Scheduling** and management
- **Token Management** system for patient queues
- **Patient Registration** and information management
- **Prescription Viewing** and management
- **Real-time Updates** across all systems

### 💰 **Billing & Payment System**
- **Invoice Creation** with detailed itemization
- **Multiple Payment Methods** (Cash, Card, Online)
- **Payment Processing** and status tracking
- **Payment History** and reporting
- **PDF Generation** for invoices and prescriptions
- **Revenue Analytics** and financial reports

### 📱 **Modern UI/UX**
- **Responsive Design** for all devices
- **Beautiful Gradients** and modern aesthetics
- **Efficient Data Updates** with REST API
- **Interactive Components** with smooth animations
- **Toast Notifications** for user feedback
- **Search & Filter** capabilities throughout

## 🌟 Live Demo

Experience the application live at: **[clinic-central.vercel.app](https://clinic-central.vercel.app)**

### 🧪 Test Accounts
- **Doctor**: Create a new account with Doctor role
- **Receptionist**: Create a new account with Receptionist role

## 📸 Application Preview

Here's a comprehensive preview of all the key features and interfaces in Clinic Central:

| Feature | Preview |
|:--------:|:-------:|
| **Authentication** | ![Login Interface](preview/login.png) |
| **User Registration** | ![Signup Interface](preview/signup.png) |
| **Doctor Dashboard** | ![Doctor Dashboard](preview/doctor_dashboard.png) |
| **Doctor Appointments** | ![Doctor Patient Appointments](preview/doctor_patient_appointment.png) |
| **Doctor Patient Queue** | ![Doctor Patient Queue](preview/doctor_patient_queue.png) |
| **Doctor Prescriptions** | ![Doctor Prescriptions](preview/doctor_prescription.png) |
| **Doctor Medicine Management** | ![Doctor Medicine Management](preview/doctor_medicine.png) |
| **Receptionist Dashboard** | ![Receptionist Dashboard](preview/receptionist_dashboard.png) |
| **Receptionist Appointments** | ![Receptionist Appointments](preview/receptionist_appointment.png) |
| **Receptionist Token Management** | ![Receptionist Token Management](preview/receptionist_tokens.png) |
| **Receptionist Prescriptions** | ![Receptionist Prescriptions](preview/receptionist_prescription.png) |
| **Receptionist Billing** | ![Receptionist Billing](preview/receptionist_billing.png) |
| **Receptionist Billing Reports** | ![Receptionist Billing Reports](preview/receptionist_billing_report.png) |

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### 1. Clone and Install
```bash
git clone https://github.com/dhruvpatel16120/clinic-management-system.git
cd clinic-management-system
npm install
```

### 2. Database Setup
1. Initialize the Prisma database:
   ```bash
   npx prisma generate
   npx prisma db push
   ```
2. Seed initial data (roles and plans):
   ```bash
   npm run seed
   ```

### 3. Environment Configuration
   ```bash
   cp env.example.txt .env
   ```

Update `.env` with your configuration:
   ```env
   JWT_SECRET=your_super_secret_key_here
   BACKEND_PORT=5000
   ```

### 4. Run Development Server
```bash
# Run both frontend and backend
npm run dev:all

# Or run separately:
npm run dev      # Frontend only (port 5173)
npm run server   # Backend only (port 5000)
```

Visit `http://localhost:5173` to see your application!

## 🏗️ Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── LogoutButton.jsx
│   ├── ProtectedRoute.jsx
│   ├── EmailVerificationStatus.jsx
│   └── TokenDisplay.jsx
├── contexts/           # React context providers
│   └── AuthContext.jsx
├── hooks/              # Custom React hooks
│   └── useAuth.js
├── pages/              # Application pages
│   ├── auth/           # Authentication pages
│   │   ├── Login.jsx
│   │   ├── Signup.jsx
│   │   ├── ForgotPasswordForm.jsx
│   │   └── VerifyEmail.jsx
│   ├── doctor/         # Doctor-specific pages
│   │   ├── Doctor.jsx
│   │   ├── appointment/
│   │   ├── prescriptions/
│   │   └── token/
│   ├── receptionist/   # Receptionist-specific pages
│   │   ├── Receptionist.jsx
│   │   ├── appointment/
│   │   ├── billing/
│   │   ├── prescriptions/
│   │   └── token/
│   └── Home.jsx
├── utils/              # Utility functions
│   └── api.js
├── App.jsx             # Main application component
└── main.jsx            # Application entry point

server/
├── routes/             # API routes
│   ├── auth.js
│   ├── clinics.js
│   ├── patients.js
│   └── billing.js
├── middleware/         # Express middleware
│   ├── auth.js
│   └── subscription.js
├── db.js               # Database connection
└── index.js            # Server entry point

prisma/
├── schema.prisma       # Database schema
├── seed.js             # Database seeding
└── migrations/         # Database migrations
```

## 🔧 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start frontend development server |
| `npm run server` | Start backend server with auto-reload |
| `npm run dev:all` | Start both frontend and backend |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint for code quality |

## 🌐 Deployment

This application is deployed on **Vercel** and is live at:
**[clinic-central.vercel.app](https://clinic-central.vercel.app)**


## 🔒 Security Features

- **JWT-based authentication** with HTTP-only cookies
- **Password hashing** with bcrypt
- **Role-based access control** with protected routes
- **Secure password reset** functionality
- **Protected API endpoints** with middleware
- **Authentication state management** with React Context

## ️ Tech Stack

### Frontend
- **React 19** - Modern React with latest features
- **Vite** - Fast build tool and development server
- **Tailwind CSS 4** - Utility-first CSS framework
- **React Router DOM** - Client-side routing
- **React Hot Toast** - Beautiful notifications
- **Lucide React** - Beautiful icons

### Backend & Database
- **Node.js/Express** - REST API server
- **Prisma ORM** - Type-safe database access
- **SQLite** - Lightweight SQL database
- **JWT** - Secure authentication tokens
- **bcrypt** - Password hashing

### Development Tools
- **ESLint** - Code quality and consistency
- **PostCSS** - CSS processing
- **Autoprefixer** - CSS vendor prefixing

## 📱 Responsive Design

- **Mobile-first** approach
- **Tablet** and **desktop** optimized
- **Touch-friendly** interface
- **Cross-browser** compatibility

## 🔄 Key Features

- **REST API** with Express.js
- **Real-time Statistics** on dashboards
- **Instant Notifications** for actions
- **Patient Queue** management
- **Subscription Management** with trial periods

## 📊 Data Management

- **Patient Records** with comprehensive information
- **Appointment Scheduling** with date/time management
- **Prescription Management** with medicine database
- **Billing System** with invoice generation
- **Token System** for patient queue management

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/AmazingFeature`)
3. **Commit** your changes (`git commit -m 'Add some AmazingFeature'`)
4. **Push** to the branch (`git push origin feature/AmazingFeature`)
5. **Open** a Pull Request

### Development Guidelines
- Follow the existing code style
- Add proper error handling
- Include relevant tests
- Update documentation as needed

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Dhruv Patel**
- GitHub: [@dhruvpatel16120](https://github.com/dhruvpatel16120)
- Live Demo: [clinic-central.vercel.app](https://clinic-central.vercel.app)

## 🙏 Acknowledgments

- **Prisma** for the excellent ORM
- **Vercel** for hosting and deployment
- **React Team** for the amazing framework
- **Tailwind CSS** for the beautiful styling system
- **Express.js** for the robust backend framework
- **Open Source Community** for inspiration and tools

## 📞 Support

If you have any questions or need help:

1. **Check** the [Documentation](DOCUMENTATION.md)
2. **Open** an [Issue](https://github.com/dhruvpatel16120/clinic-management-system/issues)
3. **Star** the repository if you find it helpful

---

<div align="center">

**⭐ Star this repository if it helped you! ⭐**

[![GitHub stars](https://img.shields.io/github/stars/dhruvpatel16120/clinic-management-system?style=social)](https://github.com/dhruvpatel16120/clinic-management-system)
[![GitHub forks](https://img.shields.io/github/forks/dhruvpatel16120/clinic-management-system?style=social)](https://github.com/dhruvpatel16120/clinic-management-system)
[![GitHub issues](https://img.shields.io/github/issues/dhruvpatel16120/clinic-management-system)](https://github.com/dhruvpatel16120/clinic-management-system/issues)

</div>
