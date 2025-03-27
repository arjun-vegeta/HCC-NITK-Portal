import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import {
  FiCalendar,
  FiClock,
  FiFileText,
  FiArrowRight,
  FiAlertCircle,
  FiUser
} from 'react-icons/fi';

const Dashboard = () => {
  const [appointments, setAppointments] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [appointmentsRes, prescriptionsRes] = await Promise.all([
        axios.get('http://localhost:5001/api/appointments/doctor/me'),
        axios.get('http://localhost:5001/api/prescriptions/doctor/me')
      ]);

      setAppointments(appointmentsRes.data);
      setPrescriptions(prescriptionsRes.data);
    } catch (err) {
      setError('Failed to fetch data');
      console.error('Error fetching data:', err);
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
        <h2 className="text-2xl font-bold text-gray-900">Doctor Dashboard</h2>
        <p className="mt-1 text-sm text-gray-500">
          Manage your appointments and prescriptions
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          to="/doctor/slots"
          className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FiCalendar className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">Manage Slots</h3>
                <p className="text-sm text-gray-500">Set your availability</p>
              </div>
            </div>
            <FiArrowRight className="h-5 w-5 text-gray-400" />
          </div>
        </Link>

        <Link
          to="/doctor/appointments"
          className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <FiClock className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">Appointments</h3>
                <p className="text-sm text-gray-500">View patient appointments</p>
              </div>
            </div>
            <FiArrowRight className="h-5 w-5 text-gray-400" />
          </div>
        </Link>

        <Link
          to="/doctor/prescriptions"
          className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <FiFileText className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">Write Prescription</h3>
                <p className="text-sm text-gray-500">Create new prescriptions</p>
              </div>
            </div>
            <FiArrowRight className="h-5 w-5 text-gray-400" />
          </div>
        </Link>
      </div>

      {/* Today's Appointments */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900">Today's Appointments</h3>
          <div className="mt-4 space-y-4">
            {appointments.length > 0 ? (
              appointments
                .filter(appointment => {
                  const appointmentDate = new Date(appointment.date);
                  const today = new Date();
                  return (
                    appointmentDate.getDate() === today.getDate() &&
                    appointmentDate.getMonth() === today.getMonth() &&
                    appointmentDate.getFullYear() === today.getFullYear()
                  );
                })
                .map((appointment) => (
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
                          {appointment.batch} • {appointment.branch}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center text-sm text-gray-500">
                        <FiClock className="h-4 w-4 mr-1" />
                        {formatTime(appointment.time)}
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
                  </div>
                ))
            ) : (
              <p className="text-gray-500 text-center py-4">No appointments for today</p>
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
              prescriptions.slice(0, 5).map((prescription) => (
                <div
                  key={prescription.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div>
                    <h4 className="font-medium text-gray-900">
                      {prescription.patient_name}
                    </h4>
                    <p className="text-sm text-gray-500">
                      {formatDate(prescription.date)}
                    </p>
                  </div>
                  <Link
                    to={`/doctor/prescriptions/${prescription.id}`}
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