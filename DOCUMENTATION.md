# 📚 Life Clinic Management System - Technical Documentation

> Comprehensive technical documentation for the Life Clinic Management System

## 📋 Table of Contents

1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [Authentication System](#authentication-system)
4. [Database Schema](#database-schema)
5. [API Reference](#api-reference)
6. [Component Documentation](#component-documentation)
7. [State Management](#state-management)
8. [Routing System](#routing-system)
9. [Security Implementation](#security-implementation)
10. [Deployment Guide](#deployment-guide)
11. [Troubleshooting](#troubleshooting)
12. [Performance Optimization](#performance-optimization)
13. [Testing Strategy](#testing-strategy)
14. [Contributing Guidelines](#contributing-guidelines)

## 🏗️ System Overview

The Life Clinic Management System is a full-stack web application built with modern web technologies. It provides comprehensive healthcare management capabilities including patient management, appointment scheduling, prescription management, billing, and role-based access control.

### Key Features
- **Multi-role Authentication**: Doctor and Receptionist roles with JWT-based security
- **Data Persistence**: Robust storage using SQLite via Prisma ORM
- **Responsive Design**: Mobile-first approach using Tailwind CSS
- **Full-Stack Performance**: Fast Node.js/Express backend
- **PDF Generation**: Invoices and prescriptions
- **Token Management**: Patient queue system
- **Integrated Medicine Creation**: Add new medicines directly from the prescription flow

## 🏛️ Architecture

### System Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                    Presentation Layer                       │
├─────────────────────────────────────────────────────────────┤
│  React Components (Pages, Components, Hooks)              │
├─────────────────────────────────────────────────────────────┤
│                    Business Logic Layer                     │
├─────────────────────────────────────────────────────────────┤
│  Custom Hooks, Context Providers, Utility Functions       │
├─────────────────────────────────────────────────────────────┤
│                    Application Layer                        │
├─────────────────────────────────────────────────────────────┤
│  Express.js REST API with Middleware (JWT, CORS)          │
├─────────────────────────────────────────────────────────────┤
│                    Data Access Layer                        │
├─────────────────────────────────────────────────────────────┤
│  Prisma ORM with SQLite Database                          │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack
- **Frontend Framework**: React with Vite
- **Styling**: Tailwind CSS
- **State Management**: React Context + Custom Hooks
- **Routing**: React Router DOM
- **Backend**: Node.js + Express
- **ORM**: Prisma
- **Database**: SQLite (Local file-based)
- **Deployment**: Local Server / Vercel (Front) + Backend Host

## 🚀 Installation & Setup Guide

### Prerequisites
Before setting up the Life Clinic Management System, ensure you have the following:

- **Node.js** (v18 or higher)
- **npm** package manager
- **SQLite3** installed on your system (usually comes pre-installed)

### Step-by-Step Installation

#### 1. **Clone and Install**
```bash
git clone https://github.com/jerviedavid/clinic-management-system.git
cd clinic-management-system
npm install
```

#### 2. **Environment Configuration**
Create a `.env` file in the root directory:
```env
# Backend Configuration
BACKEND_PORT=5000
JWT_SECRET=your_super_secret_key_here

# Frontend Proxy (handled in vite.config.js)
```

#### 3. **Database Initialization**
Prisma is used for database management. Initialize the SQLite database:
```bash
# Generate Prisma client
npx prisma generate

# Run migrations to create tables
npx prisma migrate dev --name init
```

#### 4. **Run the Application**
The project uses `concurrently` to run both the frontend and backend:
```bash
npm run dev
```
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000

---

## 🔐 Authentication System

### Authentication Flow
1. **Signup**:
   - Backend validates `email`, `password`, `fullName`, and `role`.
   - Returns clear `400 Bad Request` if data is missing or invalid.
   - Hashes password using `bcryptjs`.
   - Stores user in SQLite database.
2. **Login**:
   - Verifies credentials.
   - Generates a JWT token containing user ID and role.
   - Sets the token in an `httpOnly` secure cookie.
3. **Session**:
   - `AuthContext` retrieves user details from the `/api/auth/me` endpoint using the browser cookie.

### Role-Based Access Control
- **Doctor**: Can manage appointments, write prescriptions, and create new medicines.
- **Receptionist**: Can schedule appointments, manage billing, and track patient queues.

---

## 🗄️ Database Schema (Prisma)

### Main Models

#### 1. User
```prisma
model User {
  id             Int       @id @default(autoincrement())
  email          String    @unique
  password       String
  fullName       String
  role           String    // "doctor" | "receptionist"
  specialization String?
  createdAt      DateTime  @default(now())
}
```

#### 2. Medicine
```prisma
model Medicine {
  id                Int      @id @default(autoincrement())
  name              String
  category          String
  strength          String
  form              String   // Tablet, Syrup, etc.
  manufacturer      String
  stockQuantity     Int      @default(0)
  price             Float    @default(0)
  isActive          Boolean  @default(true)
}
```

(Refer to `prisma/schema.prisma` for the full schema including Appointments and Prescriptions)

---

## 🔌 API Reference

### Auth Routes (`/api/auth`)
- `POST /signup`: Register new staff.
- `POST /login`: Authenticate and receive cookie.
- `GET /me`: Get current authenticated user details.
- `POST /logout`: Clear session cookie.

### Data Routes (`/api/data`)
- `GET /appointments`: List all appointments.
- `POST /appointments`: Create new appointment.
- `GET /medicines`: Searchable database of medicines.
- `POST /medicines`: Create new medicine entry.

---

## 🧩 Recent Updates

### 1. Robust Signup Validation
Fixed an issue where missing fields caused generic 500 errors. The API now:
- Performs explicit checks for required fields.
- Returns detailed 400 errors indicating exactly which fields are missing.
- Improved logging for backend debugging.

### 2. "Create New Medicine" Flow
Enhanced the prescription creation process for Doctors:
- Added a **"Create New"** button directly on the `/doctor/prescriptions/create` page.
- Opens a dedicated modal to register new medicines into the database without leaving the page.
- Automatically selects the new medicine for the current prescription upon successful creation.

---

## ⚡ Performance Optimization
- **SQLite Indexing**: Optimized lookups for patients and appointments.
- **Vite Bundling**: Fast HMR and optimized production builds.
- **Selective Loading**: Custom hooks only fetch data needed for the active component.

*Last updated: January 2026*
