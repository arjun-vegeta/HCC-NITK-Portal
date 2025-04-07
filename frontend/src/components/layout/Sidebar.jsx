import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  FiHome,
  FiCalendar,
  FiFileText,
  FiUsers,
  FiPackage,
  FiSettings,
} from 'react-icons/fi';

const Sidebar = () => {
  const { user } = useAuth();
  const location = useLocation();

  const getNavItems = () => {
    switch (user?.role) {
      case 'student':
        return [
          { path: '/student', label: 'Dashboard', icon: FiHome },
          { path: '/student/book-appointment', label: 'Book Appointment', icon: FiCalendar },
          { path: '/student/appointments', label: 'My Appointments', icon: FiCalendar },
          { path: '/student/prescriptions', label: 'My Prescriptions', icon: FiFileText },
        ];
      case 'doctor':
        return [
          { path: '/doctor', label: 'Dashboard', icon: FiHome },
          { path: '/doctor/slots', label: 'Manage Slots', icon: FiCalendar },
          { path: '/doctor/appointments', label: 'Appointments', icon: FiCalendar },
          { path: '/doctor/prescriptions', label: 'Write Prescription', icon: FiFileText },
        ];
      case 'drugstore_manager':
        return [
          { path: '/drugstore', label: 'Dashboard', icon: FiHome },
          { path: '/drugstore/drugs', label: 'Manage Drugs', icon: FiPackage },
          { path: '/drugstore/prescriptions', label: 'Recent Prescriptions', icon: FiFileText },
        ];
      case 'receptionist':
        return [
          { path: '/receptionist', label: 'Dashboard', icon: FiHome },
          { path: '/receptionist/users', label: 'Manage Users', icon: FiUsers },
          { path: '/receptionist/appointments', label: 'Appointments', icon: FiCalendar },
          { path: '/receptionist/register-patient', label: 'Register Patient', icon: FiUsers },
          { path: '/receptionist/view-patients', label: 'Patients', icon: FiUsers },
        ];
      default:
        return [];
    }
  };

  return (
    <div className="w-64 bg-white shadow-sm h-screen">
      <nav className="mt-5 px-2">
        {getNavItems().map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`group flex items-center px-2 py-2 text-base font-medium rounded-md ${
                isActive
                  ? 'bg-blue-100 text-blue-900'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Icon
                className={`mr-4 h-6 w-6 ${
                  isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                }`}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

export default Sidebar; 