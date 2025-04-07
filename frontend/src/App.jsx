import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import React, { Component } from 'react';

// Layout components
import Navbar from './components/layout/Navbar';
import Sidebar from './components/layout/Sidebar';

// Auth components
import Login from './components/auth/Login';
import Register from './components/auth/Register';

// Student components
import StudentDashboard from './components/student/Dashboard';
import BookAppointment from './components/student/BookAppointment';
import MyAppointments from './components/student/MyAppointments';
import MyPrescriptions from './components/student/MyPrescriptions';

// Doctor components
import DoctorDashboard from './components/doctor/Dashboard';
import ManageSlots from './components/doctor/ManageSlots';
import Appointments from './components/doctor/Appointments';
import WritePrescription from './components/doctor/WritePrescription';
import PrescriptionDetails from './components/doctor/PrescriptionDetails';

// Drugstore components
import DrugstoreDashboard from './components/drugstore/Dashboard';
import ManageDrugs from './components/drugstore/ManageDrugs';
import RecentPrescriptions from './components/drugstore/RecentPrescriptions';

// Receptionist components
import ReceptionistDashboard from './components/receptionist/Dashboard';
import ManageUsers from './components/receptionist/ManageUsers';
import ManageAppointments from './components/receptionist/ManageAppointments';
import RegisterPatient from './components/receptionist/RegisterPatient';
import ViewPatients from './components/receptionist/ViewPatients';

// Context
import { useAuth } from './context/AuthContext';

// Proper React Error Boundary Component - CRA compatible
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false,
      error: null 
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // You can log the error to an error reporting service
    console.error('Error caught by ErrorBoundary:', error);
    console.error('Error info:', errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-red-50 p-4">
          <div className="bg-white rounded-lg shadow-md p-6 max-w-lg w-full">
            <h2 className="text-xl font-bold text-red-700 mb-4">Something went wrong</h2>
            <p className="text-gray-700 mb-4">
              The application encountered an unexpected error. Try refreshing the page or
              clearing your browser cache.
            </p>
            {this.state.error && (
              <div className="bg-gray-100 p-3 rounded text-sm font-mono overflow-auto max-h-40">
                {this.state.error.toString()}
              </div>
            )}
            <button
              onClick={() => window.location.reload()}
              className="mt-4 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Protected Route component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  console.log('ProtectedRoute - Auth state:', { user, loading });

  if (loading) {
    console.log('ProtectedRoute - Still loading auth state');
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-lg font-medium text-gray-700">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    console.log('ProtectedRoute - No user, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    console.log('ProtectedRoute - User role not allowed:', user.role);
    return <Navigate to="/" replace />;
  }

  console.log('ProtectedRoute - Access granted');
  return children;
};

// DefaultRoute component for the root path
const DefaultRoute = () => {
  const { user, loading } = useAuth();
  
  console.log('DefaultRoute - User state:', { user, loading });
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-lg font-medium text-gray-700">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (!user) {
    console.log('DefaultRoute - No user, redirecting to login');
    return <Navigate to="/login" replace />;
  }
  
  if (!user.role) {
    console.error('DefaultRoute - User has no role:', user);
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center bg-red-50 p-4 rounded-lg">
          <h2 className="text-lg font-medium text-red-800 mb-2">User account issue</h2>
          <p className="text-sm text-red-700">
            Your account is missing a role assignment. Please contact support.
          </p>
        </div>
      </div>
    );
  }
  
  console.log(`DefaultRoute - Redirecting to /${user.role}`);
  return <Navigate to={`/${user.role}`} replace />;
};

function App() {
  const { user } = useAuth();

  return (
    <ErrorBoundary>
      <Router>
        <div className="min-h-screen bg-gray-100">
          {user && <Navbar />}
          <div className="flex">
            {user && <Sidebar />}
            <main className="flex-1 p-6">
              <Routes>
                {/* Auth routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Student routes */}
                <Route
                  path="/student"
                  element={
                    <ProtectedRoute allowedRoles={['student']}>
                      <StudentDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/student/book-appointment"
                  element={
                    <ProtectedRoute allowedRoles={['student']}>
                      <BookAppointment />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/student/appointments"
                  element={
                    <ProtectedRoute allowedRoles={['student']}>
                      <MyAppointments />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/student/prescriptions"
                  element={
                    <ProtectedRoute allowedRoles={['student']}>
                      <MyPrescriptions />
                    </ProtectedRoute>
                  }
                />

                {/* Doctor routes */}
                <Route
                  path="/doctor"
                  element={
                    <ProtectedRoute allowedRoles={['doctor']}>
                      <DoctorDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/doctor/slots"
                  element={
                    <ProtectedRoute allowedRoles={['doctor']}>
                      <ManageSlots />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/doctor/appointments"
                  element={
                    <ProtectedRoute allowedRoles={['doctor']}>
                      <Appointments />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/doctor/prescriptions"
                  element={
                    <ProtectedRoute allowedRoles={['doctor']}>
                      <WritePrescription />
                    </ProtectedRoute>
                  }
                />
                <Route path="/doctor/prescriptions/:prescriptionId" element={<PrescriptionDetails />} />

                {/* Drugstore routes */}
                <Route
                  path="/drugstore"
                  element={
                    <ProtectedRoute allowedRoles={['drugstore_manager']}>
                      <DrugstoreDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/drugstore/drugs"
                  element={
                    <ProtectedRoute allowedRoles={['drugstore_manager']}>
                      <ManageDrugs />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/drugstore/prescriptions"
                  element={
                    <ProtectedRoute allowedRoles={['drugstore_manager']}>
                      <RecentPrescriptions />
                    </ProtectedRoute>
                  }
                />

                {/* Receptionist routes */}
                <Route
                  path="/receptionist"
                  element={
                    <ProtectedRoute allowedRoles={['receptionist']}>
                      <ReceptionistDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/receptionist/users"
                  element={
                    <ProtectedRoute allowedRoles={['receptionist']}>
                      <ManageUsers />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/receptionist/appointments"
                  element={
                    <ProtectedRoute allowedRoles={['receptionist']}>
                      <ManageAppointments />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/receptionist/register-patient"
                  element={
                    <ProtectedRoute allowedRoles={['receptionist']}>
                      <RegisterPatient />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/receptionist/view-patients"
                  element={
                    <ProtectedRoute allowedRoles={['receptionist']}>
                      <ViewPatients />
                    </ProtectedRoute>
                  }
                />

                {/* Default route */}
                <Route path="/" element={<DefaultRoute />} />
              </Routes>
            </main>
          </div>
        </div>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
