import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import {
  FiCalendar,
  FiClock,
  FiUser,
  FiArrowRight,
  FiAlertCircle,
  FiFileText
} from 'react-icons/fi';

const Dashboard = () => {
  const [appointments, setAppointments] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth(); // Get user from context

  useEffect(() => {
    // Check if user exists before fetching data
    if (user) {
      // Explicit delay to ensure token is properly set
      setTimeout(() => {
        // Reset the Authorization header explicitly
        const token = localStorage.getItem('token');
        if (token) {
          console.log('Student Dashboard: Setting Authorization header before fetchData');
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        }
        fetchData();
      }, 100);
    }
  }, [user]); // Add user as a dependency

  const fetchData = async () => {
    try {
      // Debug token
      const token = localStorage.getItem('token');
      console.log('Student Dashboard: Token exists:', token ? 'Yes' : 'No');
      console.log('Student Dashboard: Token in axios defaults:', axios.defaults.headers.common['Authorization'] ? 'Yes' : 'No');
      
      if (!token) {
        setError('Authentication token missing. Please login again.');
        setLoading(false);
        return;
      }
      
      console.log('Student Dashboard: Making API requests');
      
      // Clean the token and set headers directly
      const cleanToken = token.trim();
      console.log('Student Dashboard: Clean token length:', cleanToken.length);
      
      // Set headers directly for these requests
      const headers = { 'Authorization': `Bearer ${cleanToken}` };
      
      try {
        // Make API requests separately with better error handling
        const studentId = user.id;
        
        console.log('Student Dashboard: Making request to:', `/api/appointments/student/${studentId}`);
        const appointmentsRes = await axios.get(`/api/appointments/student/${studentId}`, { headers });
        console.log('Student Dashboard: Successfully fetched appointments:', appointmentsRes.data.length);
        setAppointments(appointmentsRes.data);
        
        const prescriptionsRes = await axios.get(`/api/prescriptions/patient/${studentId}`, { headers });
        console.log('Student Dashboard: Successfully fetched prescriptions:', prescriptionsRes.data.length);
        setPrescriptions(prescriptionsRes.data);
      } catch (apiError) {
        console.error('Student Dashboard: API request failed:', apiError);
        if (apiError.response) {
          console.error('Student Dashboard: Error status:', apiError.response.status);
          console.error('Student Dashboard: Error data:', apiError.response.data);
          setError(`Error: ${apiError.response.data.message || 'Failed to fetch data'}`);
        } else if (apiError.request) {
          console.error('Student Dashboard: No response received from server');
          setError('Server not responding. Please check your connection and try again.');
        } else {
          console.error('Student Dashboard: Request setup error:', apiError.message);
          setError(`Error: ${apiError.message}`);
        }
      }
    } catch (err) {
      console.error('Student Dashboard: Unexpected error:', err);
      setError('An unexpected error occurred. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <FiAlertCircle className="h-5 w-5 text-red-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">{error}</h3>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Welcome to HCC Portal</h2>
        <p className="mt-1 text-sm text-gray-500">
          Manage your appointments and prescriptions
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          to="/student/book-appointment"
          className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FiCalendar className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">Book Appointment</h3>
                <p className="text-sm text-gray-500">Schedule a consultation</p>
              </div>
            </div>
            <FiArrowRight className="h-5 w-5 text-gray-400" />
          </div>
        </Link>

        <Link
          to="/student/appointments"
          className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <FiClock className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">My Appointments</h3>
                <p className="text-sm text-gray-500">View upcoming appointments</p>
              </div>
            </div>
            <FiArrowRight className="h-5 w-5 text-gray-400" />
          </div>
        </Link>

        <Link
          to="/student/prescriptions"
          className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <FiFileText className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">My Prescriptions</h3>
                <p className="text-sm text-gray-500">View medical prescriptions</p>
              </div>
            </div>
            <FiArrowRight className="h-5 w-5 text-gray-400" />
          </div>
        </Link>
      </div>

      {/* Recent Appointments */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900">Recent Appointments</h3>
          <div className="mt-4 space-y-4">
            {appointments.length > 0 ? (
              appointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div>
                    <h4 className="font-medium text-gray-900">
                      Dr. {appointment.doctor_name}
                    </h4>
                    <p className="text-sm text-gray-500">
                      {formatDate(appointment.date)} at {formatTime(appointment.time)}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      appointment.status === 'scheduled'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {appointment.status}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No recent appointments</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Prescriptions */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900">Recent Prescriptions</h3>
          <div className="mt-4 space-y-4">
            {prescriptions.length > 0 ? (
              prescriptions.map((prescription) => (
                <div
                  key={prescription.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div>
                    <h4 className="font-medium text-gray-900">
                      Prescribed by Dr. {prescription.doctor_name}
                    </h4>
                    <p className="text-sm text-gray-500">
                      {formatDate(prescription.date)}
                    </p>
                  </div>
                  <Link
                    to={`/student/prescriptions/${prescription.id}`}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    View Details
                  </Link>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No recent prescriptions</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 