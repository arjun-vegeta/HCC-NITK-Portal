import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  FiFileText,
  FiCheck,
  FiX,
  FiAlertCircle,
  FiUser,
  FiPackage
} from 'react-icons/fi';

const ProcessPrescriptions = () => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  const fetchPrescriptions = async () => {
    try {
      const response = await axios.get('http://localhost:5001/api/drugs/prescriptions');
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
      await axios.post(`http://localhost:5001/api/drugs/prescriptions/${prescriptionId}/dispense`);
      setSuccess('Prescription dispensed successfully');
      fetchPrescriptions();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to dispense prescription');
    }
  };

  const handleReject = async (prescriptionId) => {
    try {
      await axios.post(`http://localhost:5001/api/drugs/prescriptions/${prescriptionId}/reject`);
      setSuccess('Prescription rejected successfully');
      fetchPrescriptions();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reject prescription');
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
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Process Prescriptions</h2>
        <p className="mt-1 text-sm text-gray-500">
          Review and process pending prescriptions
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

      {/* Prescriptions List */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6">
          <div className="space-y-4">
            {prescriptions.length > 0 ? (
              prescriptions.map((prescription) => (
                <div
                  key={prescription.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                          <FiUser className="h-6 w-6 text-blue-600" />
                        </div>
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">
                          {prescription.patient_name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          Prescribed by Dr. {prescription.doctor_name}
                        </p>
                        <div className="mt-2 space-y-1">
                          {prescription.medications.map((med, index) => (
                            <div key={index} className="flex items-center space-x-2">
                              <FiPackage className="h-4 w-4 text-gray-400" />
                              <span className="text-sm text-gray-600">
                                {med.drug_name} - {med.quantity} units
                              </span>
                            </div>
                          ))}
                        </div>
                        <div className="mt-2 text-sm text-gray-500">
                          Prescribed on {formatDate(prescription.date)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {prescription.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleDispense(prescription.id)}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                          >
                            <FiCheck className="h-4 w-4 mr-1" />
                            Dispense
                          </button>
                          <button
                            onClick={() => handleReject(prescription.id)}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                          >
                            <FiX className="h-4 w-4 mr-1" />
                            Reject
                          </button>
                        </>
                      )}
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          prescription.status === 'dispensed'
                            ? 'bg-green-100 text-green-800'
                            : prescription.status === 'rejected'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {prescription.status.charAt(0).toUpperCase() + prescription.status.slice(1)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <FiFileText className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No prescriptions</h3>
                <p className="mt-1 text-sm text-gray-500">
                  There are no prescriptions to process at the moment.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProcessPrescriptions; 