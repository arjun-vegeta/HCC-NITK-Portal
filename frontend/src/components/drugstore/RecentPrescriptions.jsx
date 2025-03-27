import { useState, useEffect } from 'react';
import axios from 'axios';
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

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  const fetchPrescriptions = async () => {
    try {
      const response = await axios.get('http://localhost:5001/api/drugs/recent-prescriptions');
      setPrescriptions(response.data);
    } catch (err) {
      setError('Failed to fetch prescriptions');
      console.error('Error fetching prescriptions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDispense = async (prescriptionId) => {
    try {
      await axios.post(`http://localhost:5001/api/drugs/dispense/${prescriptionId}`);
      // Refresh prescriptions after dispensing
      fetchPrescriptions();
    } catch (err) {
      console.error('Error dispensing prescription:', err);
      setError('Failed to dispense prescription');
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

      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6">
          <div className="space-y-4">
            {prescriptions.length > 0 ? (
              prescriptions.map((prescription) => (
                <div
                  key={prescription.prescription_id}
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
                        onClick={() => handleDispense(prescription.prescription_id)}
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