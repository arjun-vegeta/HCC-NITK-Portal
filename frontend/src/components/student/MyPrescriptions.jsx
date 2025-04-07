import { useState, useEffect } from 'react';
import axios from 'axios';
import { FiFileText, FiUser, FiCalendar, FiAlertCircle, FiPackage } from 'react-icons/fi';

const MyPrescriptions = () => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  const fetchPrescriptions = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Get token directly for this request
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication token missing. Please log in again.');
        setLoading(false);
        return;
      }
      
      // Get user ID from JWT token
      const userIdMatch = atob(token.split('.')[1]).match(/"userId":(\d+)/);
      const userId = userIdMatch ? userIdMatch[1] : null;
      
      if (!userId) {
        setError('User ID not found in token. Please log in again.');
        setLoading(false);
        return;
      }
      
      console.log('MyPrescriptions: Fetching prescriptions for user ID:', userId);
      
      // Set headers explicitly for this request
      const headers = { 'Authorization': `Bearer ${token}` };
      
      const response = await axios.get(`/api/prescriptions/patient/${userId}`, { headers });
      console.log('MyPrescriptions: Successfully fetched prescriptions:', response.data.length);
      setPrescriptions(response.data);
    } catch (err) {
      console.error('Error fetching prescriptions:', err);
      if (err.response) {
        console.error('API error status:', err.response.status);
        console.error('API error data:', err.response.data);
        setError(`Error: ${err.response.data.message || 'Failed to fetch prescriptions'}`);
      } else if (err.request) {
        setError('Server not responding. Please check your connection and try again.');
      } else {
        setError(`Error: ${err.message}`);
      }
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
        <h2 className="text-2xl font-bold text-gray-900">My Prescriptions</h2>
        <p className="mt-1 text-sm text-gray-500">
          View your medical prescriptions and medication details
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

      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6">
          {prescriptions.length > 0 ? (
            <div className="space-y-6">
              {prescriptions.map((prescription) => (
                <div
                  key={prescription.id}
                  className="border rounded-lg p-4 space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <FiFileText className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">
                          Prescribed by Dr. {prescription.doctor_name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {formatDate(prescription.date)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {prescription.notes && (
                    <div className="text-sm text-gray-600">
                      <p className="font-medium">Notes:</p>
                      <p>{prescription.notes}</p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-900">Medications:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {prescription.drugs.map((drug, index) => (
                        <div
                          key={index}
                          className="bg-gray-50 rounded-lg p-3 flex items-start space-x-3"
                        >
                          <div className="p-2 bg-purple-100 rounded-lg">
                            <FiPackage className="h-5 w-5 text-purple-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {drug.drug_name}
                            </p>
                            <p className="text-sm text-gray-500">
                              Quantity: {drug.quantity}
                            </p>
                            <div className="mt-1 flex flex-wrap gap-2">
                              {drug.morning && (
                                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                                  Morning
                                </span>
                              )}
                              {drug.noon && (
                                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                                  Noon
                                </span>
                              )}
                              {drug.evening && (
                                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                                  Evening
                                </span>
                              )}
                              {drug.night && (
                                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                                  Night
                                </span>
                              )}
                            </div>
                            {drug.notes && (
                              <p className="text-xs text-gray-500 mt-1">
                                {drug.notes}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <FiFileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No prescriptions
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                You don't have any prescriptions yet.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyPrescriptions; 