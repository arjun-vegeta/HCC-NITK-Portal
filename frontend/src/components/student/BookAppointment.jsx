import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { FiCalendar, FiClock, FiUser, FiAlertCircle } from 'react-icons/fi';

const BookAppointment = () => {
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    // Reset the Authorization header explicitly with a slight delay
    setTimeout(() => {
      const token = localStorage.getItem('token');
      if (token) {
        console.log('BookAppointment: Setting Authorization header before API calls');
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }
      
      if (user) {
        fetchDoctors();
      }
    }, 100);
  }, [user]);

  useEffect(() => {
    if (selectedDoctor && selectedDate) {
      // Small delay to ensure token is set
      setTimeout(() => {
        fetchSlots();
      }, 50);
    }
  }, [selectedDoctor, selectedDate]);

  const fetchDoctors = async () => {
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
      console.log('BookAppointment: Clean token length:', cleanToken.length);
      
      // Set headers directly for this request
      const headers = { 'Authorization': `Bearer ${cleanToken}` };
      
      console.log('BookAppointment: Fetching doctors...');
      const response = await axios.get('/api/doctors', { headers });
      console.log('BookAppointment: Successfully fetched doctors:', response.data.length);
      setDoctors(response.data);
    } catch (err) {
      console.error('Error fetching doctors:', err);
      if (err.response) {
        console.error('API error status:', err.response.status);
        console.error('API error data:', err.response.data);
        setError(`Error: ${err.response.data.message || 'Failed to fetch doctors'}`);
      } else if (err.request) {
        setError('Server not responding. Please check your connection and try again.');
      } else {
        setError(`Error: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchSlots = async () => {
    try {
      setError('');
      
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
      
      console.log(`BookAppointment: Fetching slots for doctor ${selectedDoctor} on ${selectedDate}`);
      const response = await axios.get(
        `/api/doctors/${selectedDoctor}/slots?date=${selectedDate}`,
        { headers }
      );
      console.log('BookAppointment: Successfully fetched slots:', response.data.length);
      setSlots(response.data);
    } catch (err) {
      console.error('Error fetching slots:', err);
      if (err.response) {
        console.error('API error status:', err.response.status);
        console.error('API error data:', err.response.data);
        setError(`Error: ${err.response.data.message || 'Failed to fetch available slots'}`);
      } else if (err.request) {
        setError('Server not responding. Please check your connection and try again.');
      } else {
        setError(`Error: ${err.message}`);
      }
    }
  };

  const handleBookAppointment = async (slotId) => {
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
      
      console.log(`BookAppointment: Booking appointment for slot ${slotId}`);
      await axios.post('/api/appointments', {
        slot_id: slotId
      }, { headers });
      
      setSuccess('Appointment booked successfully!');
      // Refresh slots after booking
      fetchSlots();
    } catch (err) {
      console.error('Error booking appointment:', err);
      if (err.response) {
        console.error('API error status:', err.response.status);
        console.error('API error data:', err.response.data);
        setError(`Error: ${err.response.data.message || 'Failed to book appointment'}`);
      } else if (err.request) {
        setError('Server not responding. Please check your connection and try again.');
      } else {
        setError(`Error: ${err.message}`);
      }
    }
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
        <h2 className="text-2xl font-bold text-gray-900">Book an Appointment</h2>
        <p className="mt-1 text-sm text-gray-500">
          Select a doctor and available time slot
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

      <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
        {/* Doctor Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Select Doctor
          </label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiUser className="h-5 w-5 text-gray-400" />
            </div>
            <select
              value={selectedDoctor}
              onChange={(e) => setSelectedDoctor(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            >
              <option value="">Select a doctor</option>
              {doctors.map((doctor) => (
                <option key={doctor.id} value={doctor.id}>
                  Dr. {doctor.name} - {doctor.specialization}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Date Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Select Date
          </label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiCalendar className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            />
          </div>
        </div>

        {/* Available Slots */}
        {selectedDoctor && selectedDate && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Available Time Slots
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {slots.map((slot) => (
                <button
                  key={slot.id}
                  onClick={() => handleBookAppointment(slot.id)}
                  disabled={!slot.is_available}
                  className={`flex items-center justify-center p-3 rounded-lg border ${
                    slot.is_available
                      ? 'border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700'
                      : 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <FiClock className="h-4 w-4 mr-2" />
                  {formatTime(slot.time)}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookAppointment; 