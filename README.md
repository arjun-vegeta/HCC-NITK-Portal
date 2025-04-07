# Healthcare Center (HCC) Management System

A full-stack web application for managing doctor appointments and patient records. Built with React.js frontend and Node.js backend.

## Features

### For Students (Patients)
- User authentication and authorization
- View and book appointments with doctors
- View appointment history
- Manage personal profile
- View and track prescriptions
- Real-time appointment status updates

### For Doctors
- Secure login and authentication
- View and manage appointments
- Update appointment status (scheduled, completed, cancelled)
- Filter appointments by date
- View patient information
- Create and manage prescriptions
- View patient medical history

### For Receptionists
- User management (create, edit, delete users)
- Register new patients
- Manage appointments
- View all patients
- Access to comprehensive user database
- Manage doctor schedules
- Handle appointment cancellations and rescheduling

### For Drugstore Managers
- View and manage prescriptions
- Track prescription status
- Manage drug inventory
- Process prescription dispensing
- View patient prescription history

## Tech Stack

### Frontend
- React.js
- React Router for navigation
- Axios for API calls
- React Icons for UI elements
- Context API for state management
- Tailwind CSS for styling

### Backend
- Node.js
- Express.js
- MongoDB for database
- JWT for authentication
- RESTful API architecture

## Project Structure

```
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/
│   │   │   │   ├── Login.jsx
│   │   │   │   └── Register.jsx
│   │   │   ├── doctor/
│   │   │   │   ├── Appointments.jsx
│   │   │   │   ├── Dashboard.jsx
│   │   │   │   ├── ManageSlots.jsx
│   │   │   │   ├── PrescriptionDetails.jsx
│   │   │   │   └── WritePrescription.jsx
│   │   │   ├── drugstore/
│   │   │   │   ├── Dashboard.jsx
│   │   │   │   ├── ManageDrugs.jsx
│   │   │   │   ├── ProcessPrescriptions.jsx
│   │   │   │   └── RecentPrescriptions.jsx
│   │   │   ├── layout/
│   │   │   │   ├── Navbar.jsx
│   │   │   │   └── Sidebar.jsx
│   │   │   ├── receptionist/
│   │   │   │   ├── Dashboard.jsx
│   │   │   │   ├── ManageAppointments.jsx
│   │   │   │   ├── ManageUsers.jsx
│   │   │   │   ├── RegisterPatient.jsx
│   │   │   │   └── ViewPatients.jsx
│   │   │   └── student/
│   │   │       ├── BookAppointment.jsx
│   │   │       ├── Dashboard.jsx
│   │   │       ├── MyAppointments.jsx
│   │   │       └── MyPrescriptions.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── assets/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── index.js
│   │   ├── index.css
│   │   └── reportWebVitals.js
│   └── package.json
│
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   │   ├── appointments.js
│   │   │   ├── auth.js
│   │   │   ├── doctors.js
│   │   │   ├── drugs.js
│   │   │   ├── prescriptions.js
│   │   │   └── users.js
│   │   ├── middleware/
│   │   │   └── auth.js
│   │   ├── database/
│   │   │   ├── hcc.db
│   │   │   ├── hospital.db
│   │   │   └── init.js
│   │   └── server.js
│   ├── package.json
│   └── package-lock.json
```

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- MongoDB

### Installation

1. Clone the repository
```bash
git clone [repository-url]
```

2. Install backend dependencies
```bash
cd backend
npm install
```

3. Install frontend dependencies
```bash
cd frontend
npm install
```

4. Set up environment variables
Create a `.env` file in the backend directory with the following variables:
```
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
```

5. Start the development servers

Backend:
```bash
cd backend
npm run dev
```

Frontend:
```bash
cd frontend
npm start
```

The application will be available at `http://localhost:3000`

## API Endpoints

### Authentication
- POST `/api/auth/register` - Register new user
- POST `/api/auth/login` - User login
- GET `/api/auth/verify` - Verify JWT token

### Appointments
- GET `/api/appointments/doctor/:id` - Get doctor's appointments
- POST `/api/appointments` - Create new appointment
- PATCH `/api/appointments/:id` - Update appointment status
- GET `/api/appointments/patient/:id` - Get patient's appointments

### Users
- GET `/api/users` - Get all users (receptionist only)
- POST `/api/users` - Create new user (receptionist only)
- PATCH `/api/users/:id` - Update user
- DELETE `/api/users/:id` - Delete user (receptionist only)

### Prescriptions
- GET `/api/prescriptions/patient/:id` - Get patient's prescriptions
- POST `/api/prescriptions` - Create new prescription
- PATCH `/api/prescriptions/:id` - Update prescription status
- GET `/api/prescriptions/doctor/:id` - Get doctor's prescriptions


