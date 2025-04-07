import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { FiCalendar, FiClock, FiUser, FiAlertCircle, FiX } from 'react-icons/fi';

const MyAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    // Reset the Authorization header explicitly with a slight delay
    setTimeout(() => {
      const token = localStorage.getItem('token');
      if (token) {
        console.log('MyAppointments: Setting Authorization header before API calls');
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }
      
      if (user) {
        fetchAppointments();
      }
    }, 100);
  }, [user]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Get token directly for this request
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication token missing. Please login again.');
        setLoading(false);
        return;
      }
      
      // Clean the token and set headers explicitly
      const cleanToken = token.trim();
      
      // Set headers directly for this request
      const headers = { 'Authorization': `Bearer ${cleanToken}` };
      
      console.log(`MyAppointments: Fetching appointments for student ${user.id}`);
      const response = await axios.get(`/api/appointments/student/${user.id}`, { headers });
      console.log('MyAppointments: Successfully fetched appointments:', response.data.length);
      setAppointments(response.data);
    } catch (err) {
      console.error('Error fetching appointments:', err);
      if (err.response) {
        console.error('API error status:', err.response.status);
        console.error('API error data:', err.response.data);
        setError(`Error: ${err.response.data.message || 'Failed to fetch appointments'}`);
      } else if (err.request) {
        setError('Server not responding. Please check your connection and try again.');
      } else {
        setError(`Error: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAppointment = async (appointmentId) => {
    try {
      setError('');
      setSuccess('');
      
      // Get token directly for this request
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication token missing. Please login again.');
        return;
      }
      
      // Clean the token and set headers explicitly
      const cleanToken = token.trim();
      
      // Set headers directly for this request
      const headers = { 'Authorization': `Bearer ${cleanToken}` };
      
      console.log(`MyAppointments: Cancelling appointment ${appointmentId}`);
      await axios.delete(`/api/appointments/${appointmentId}`, { headers });
      console.log('MyAppointments: Successfully cancelled appointment');
      setSuccess('Appointment cancelled successfully!');
      
      // Fetch updated appointments
      fetchAppointments();
    } catch (err) {
      console.error('Error cancelling appointment:', err);
      if (err.response) {
        console.error('API error status:', err.response.status);
        console.error('API error data:', err.response.data);
        setError(`Error: ${err.response.data.message || 'Failed to cancel appointment'}`);
      } else if (err.request) {
        setError('Server not responding. Please check your connection and try again.');
      } else {
        setError(`Error: ${err.message}`);
      }
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

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">My Appointments</h2>
        <p className="mt-1 text-sm text-gray-500">
          View and manage your appointments
        </p>
      </div>

      {error && (
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
      )}

      {success && (
        <div className="rounded-md bg-green-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <FiAlertCircle className="h-5 w-5 text-green-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">{success}</h3>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6">
          {appointments.length > 0 ? (
            <div className="space-y-4">
              {appointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                        <FiUser className="h-6 w-6 text-blue-600" />
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">
                        Dr. {appointment.doctor_name}
                      </h4>
                      <div className="flex items-center space-x-4 mt-1">
                        <div className="flex items-center text-sm text-gray-500">
                          <FiCalendar className="h-4 w-4 mr-1" />
                          {formatDate(appointment.date)}
                        </div>
                        <div className="flex items-center text-sm text-gray-500">
                          <FiClock className="h-4 w-4 mr-1" />
                          {formatTime(appointment.time)}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        appointment.status === 'scheduled'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {appointment.status}
                    </span>
                    {appointment.status === 'scheduled' && (
                      <button
                        onClick={() => handleCancelAppointment(appointment.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <FiX className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <FiCalendar className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No appointments</h3>
              <p className="mt-1 text-sm text-gray-500">
                You haven't booked any appointments yet.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyAppointments; 