import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import {
  FiUser,
  FiCheck,
  FiX,
  FiAlertCircle,
  FiLoader
} from 'react-icons/fi';

const RecentPrescriptions = () => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    // Reset the Authorization header explicitly with a slight delay
    setTimeout(() => {
      const token = localStorage.getItem('token');
      if (token) {
        console.log('RecentPrescriptions: Setting Authorization header before API calls');
        axios.defaults.headers.common['Authorization'] = `Bearer ${token.trim()}`;
      }
      
      if (user) {
        fetchPrescriptions();
      }
    }, 100);
  }, [user]);

  const fetchPrescriptions = async () => {
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
      
      // Clean the token and set headers directly
      const cleanToken = token.trim();
      
      // Set headers directly for this request
      const headers = { 'Authorization': `Bearer ${cleanToken}` };
      
      console.log('RecentPrescriptions: Fetching prescriptions...');
      const response = await axios.get('/api/prescriptions/pending', { headers });
      console.log('RecentPrescriptions: Successfully fetched prescriptions:', response.data.length);
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

  const handleDispense = async (prescriptionDrugId) => {
    try {
      setError('');
      setSuccess('');
      
      // Get token directly for this request
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication token missing. Please login again.');
        return;
      }
      
      // Clean the token and set headers directly
      const cleanToken = token.trim();
      
      // Set headers directly for this request
      const headers = { 'Authorization': `Bearer ${cleanToken}` };
      
      console.log('RecentPrescriptions: Dispensing prescription drug:', prescriptionDrugId);
      await axios.patch(`/api/drugs/prescription-drugs/${prescriptionDrugId}/sold`, {}, { headers });
      console.log('RecentPrescriptions: Successfully dispensed prescription drug');
      
      setSuccess('Drug dispensed successfully');
      fetchPrescriptions();
    } catch (err) {
      console.error('Error dispensing prescription:', err);
      if (err.response) {
        console.error('API error status:', err.response.status);
        console.error('API error data:', err.response.data);
        setError(`Error: ${err.response.data.message || 'Failed to dispense prescription'}`);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <FiLoader className="animate-spin h-8 w-8 text-blue-500" />
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
        <h2 className="text-2xl font-bold text-gray-900">Recent Prescriptions</h2>
        <p className="mt-1 text-sm text-gray-500">
          View and process recent prescriptions
        </p>
      </div>

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

      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6">
          <div className="space-y-4">
            {prescriptions.length > 0 ? (
              prescriptions.map((prescription) => (
                <div
                  key={prescription.prescription_drug_id}
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
                        {prescription.patient_name}
                      </h4>
                      <p className="text-sm text-gray-500">
                        {prescription.drug_name} • Quantity: {prescription.quantity}
                      </p>
                      <p className="text-sm text-gray-500">
                        Prescribed by: {prescription.doctor_name}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-sm text-gray-500">
                      {formatDate(prescription.date)}
                    </div>
                    {!prescription.is_sold && (
                      <button
                        onClick={() => handleDispense(prescription.prescription_drug_id)}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                      >
                        <FiCheck className="h-4 w-4 mr-1" />
                        Dispense
                      </button>
                    )}
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        prescription.is_sold
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {prescription.is_sold ? 'Dispensed' : 'Pending'}
                    </span>
                  </div>
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

export default RecentPrescriptions; 