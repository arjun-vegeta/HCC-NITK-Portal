import { useState, useEffect } from 'react';
import axios from 'axios';
import { FiCalendar, FiClock, FiAlertCircle, FiPlus, FiX, FiCheck } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';

const ManageSlots = () => {
  const [selectedDate, setSelectedDate] = useState('');
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [newSlots, setNewSlots] = useState([]);
  const { user } = useAuth();

  useEffect(() => {
    // Reset the Authorization header explicitly with a slight delay
    setTimeout(() => {
      const token = localStorage.getItem('token');
      if (token) {
        console.log('ManageSlots: Setting Authorization header before API calls');
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }
      
      if (user && selectedDate) {
        fetchSlots();
      }
    }, 100);
  }, [user, selectedDate]);

  const fetchSlots = async () => {
    try {
      setLoading(true);
      
      // Get the doctor's ID
      let doctorId = user.id;
      
      const response = await axios.get(`/api/doctors/${doctorId}/slots?date=${selectedDate}`);
      setSlots(response.data);
      setError(''); // Clear any previous errors
    } catch (err) {
      console.error('Error fetching slots:', err);
      setError('Failed to fetch slots. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSlot = () => {
    setNewSlots([...newSlots, { time: '' }]);
  };

  const handleRemoveSlot = (index) => {
    setNewSlots(newSlots.filter((_, i) => i !== index));
  };

  const handleSlotChange = (index, value) => {
    const updatedSlots = [...newSlots];
    updatedSlots[index] = { time: value };
    setNewSlots(updatedSlots);
  };

  const handleSubmit = async () => {
    try {
      const validSlots = newSlots
        .filter(slot => slot.time)
        .map(slot => ({ time: slot.time }));

      if (validSlots.length === 0) {
        setError('Please add at least one time slot');
        return;
      }

      await axios.post('/api/doctors/slots', {
        date: selectedDate,
        slots: validSlots
      });

      setSuccess('Slots added successfully!');
      setNewSlots([]);
      fetchSlots();
    } catch (err) {
      console.error('Error adding slots:', err);
      setError(err.response?.data?.message || 'Failed to add slots');
    }
  };

  const handleToggleAvailability = async (slotId, isAvailable) => {
    try {
      await axios.patch(`/api/doctors/slots/${slotId}`, {
        is_available: !isAvailable
      });
      
      setSuccess(`Slot ${isAvailable ? 'disabled' : 'enabled'} successfully!`);
      fetchSlots();
    } catch (error) {
      console.error('Error updating slot availability:', error);
      setError(error.response?.data?.message || 'Failed to update slot availability');
    }
  };

  const formatTime = (timeString) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  if (loading && selectedDate) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Manage Availability</h2>
        <p className="mt-1 text-sm text-gray-500">
          Set your available time slots for appointments
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

      <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
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

        {/* Add New Slots */}
        {selectedDate && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Add New Slots</h3>
              <button
                onClick={handleAddSlot}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <FiPlus className="h-4 w-4 mr-1" />
                Add Slot
              </button>
            </div>

            <div className="space-y-3">
              {newSlots.map((slot, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className="flex-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiClock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="time"
                      value={slot.time}
                      onChange={(e) => handleSlotChange(index, e.target.value)}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                    />
                  </div>
                  <button
                    onClick={() => handleRemoveSlot(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <FiX className="h-5 w-5" />
                  </button>
                </div>
              ))}
            </div>

            {newSlots.length > 0 && (
              <button
                onClick={handleSubmit}
                className="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Save Slots
              </button>
            )}
          </div>
        )}

        {/* Existing Slots */}
        {selectedDate && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Existing Slots</h3>
            {slots.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {slots.map((slot) => (
                  <div
                    key={slot.id}
                    className={`p-4 border rounded-lg ${
                      slot.is_available
                        ? 'bg-green-50 border-green-200'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <FiClock className="h-5 w-5 text-gray-400 mr-2" />
                        <span className="text-gray-900 font-medium">
                          {formatTime(slot.time)}
                        </span>
                      </div>
                      <button
                        onClick={() => handleToggleAvailability(slot.id, slot.is_available)}
                        className={`px-3 py-1 text-xs font-medium rounded-full ${
                          slot.is_available
                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                        }`}
                      >
                        {slot.is_available ? 'Available' : 'Unavailable'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">
                No slots created for this date
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageSlots; 