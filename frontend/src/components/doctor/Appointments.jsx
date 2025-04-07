import { useState, useEffect } from 'react';
import axios from 'axios';
import { FiUser, FiCalendar, FiClock, FiAlertCircle, FiCheck, FiX } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';

const Appointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    // Reset the Authorization header explicitly with a slight delay
    setTimeout(() => {
      const token = localStorage.getItem('token');
      if (token) {
        console.log('Appointments: Setting Authorization header before API calls');
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }
      
      if (user) {
        fetchAppointments();
      }
    }, 100);
  }, [user, selectedDate]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);

      let url = `/api/appointments/doctor/${user.id}`;
      if (selectedDate) {
        url += `?date=${selectedDate}`;
      }
      
      const response = await axios.get(url);
      setAppointments(response.data);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      setError('Failed to fetch appointments. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const updateAppointmentStatus = async (appointmentId, status) => {
    try {
      await axios.patch(`/api/appointments/${appointmentId}`, { status });
      setSuccess(`Appointment marked as ${status}`);
      fetchAppointments();
    } catch (error) {
      console.error('Error updating appointment:', error);
      setError('Failed to update appointment status');
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
    <div className="space-y-6">
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
              <FiCheck className="h-5 w-5 text-green-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">{success}</h3>
            </div>
          </div>
        </div>
      )}

      {/* Date Filter */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Filter by Date
        </label>
        <div className="flex items-center">
          <div className="relative rounded-md shadow-sm flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiCalendar className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            />
          </div>
          <button
            onClick={() => setSelectedDate('')}
            className="ml-2 inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Appointments List */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {selectedDate ? `Appointments for ${formatDate(selectedDate)}` : 'All Appointments'}
          </h3>
          <div className="space-y-4">
            {appointments.length > 0 ? (
              appointments.map((appointment) => (
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
                        {appointment.patient_name}
                      </h4>
                      <p className="text-sm text-gray-500">
                        {appointment.patient_email}
                      </p>
                      <div className="flex items-center text-sm text-gray-500 mt-1">
                        <FiCalendar className="h-4 w-4 mr-1" />
                        {formatDate(appointment.date)}
                        <span className="mx-2">•</span>
                        <FiClock className="h-4 w-4 mr-1" />
                        {formatTime(appointment.time)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        appointment.status === 'scheduled'
                          ? 'bg-yellow-100 text-yellow-800'
                          : appointment.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                    </span>
                    {appointment.status === 'scheduled' && (
                      <button
                        onClick={() => updateAppointmentStatus(appointment.id, 'completed')}
                        className="ml-2 p-1 text-green-600 hover:text-green-800"
                        title="Mark as Completed"
                      >
                        <FiCheck className="h-5 w-5" />
                      </button>
                    )}
                    {appointment.status === 'scheduled' && (
                      <button
                        onClick={() => updateAppointmentStatus(appointment.id, 'cancelled')}
                        className="p-1 text-red-600 hover:text-red-800"
                        title="Cancel Appointment"
                      >
                        <FiX className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 py-4">
                No appointments found
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Appointments; 