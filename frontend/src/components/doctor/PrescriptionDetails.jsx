import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FiUser, FiPackage, FiCalendar, FiClock, FiArrowLeft } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';

const PrescriptionDetails = () => {
  const { prescriptionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [prescription, setPrescription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPrescriptionDetails = async () => {
      try {
        setLoading(true);
        setError('');
        
        const token = localStorage.getItem('token');
        if (token) {
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        }

        const response = await axios.get(`/api/prescriptions/${prescriptionId}`);
        console.log('Prescription details:', response.data);
        setPrescription(response.data);
      } catch (err) {
        console.error('Error fetching prescription details:', err);
        setError(err.response?.data?.message || 'Error fetching prescription details');
      } finally {
        setLoading(false);
      }
    };

    fetchPrescriptionDetails();
  }, [prescriptionId]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12">
        <div className="relative py-3 sm:max-w-xl sm:mx-auto">
          <div className="relative px-4 py-10 bg-white mx-8 md:mx-0 shadow rounded-3xl sm:p-10">
            <div className="max-w-md mx-auto">
              <div className="flex items-center space-x-5">
                <div className="block pl-2 font-semibold text-xl self-start text-gray-700">
                  <h2 className="leading-relaxed">Loading prescription details...</h2>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12">
        <div className="relative py-3 sm:max-w-xl sm:mx-auto">
          <div className="relative px-4 py-10 bg-white mx-8 md:mx-0 shadow rounded-3xl sm:p-10">
            <div className="max-w-md mx-auto">
              <div className="flex items-center space-x-5">
                <div className="block pl-2 font-semibold text-xl self-start text-gray-700">
                  <h2 className="leading-relaxed text-red-600">{error}</h2>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!prescription) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12">
      <div className="relative py-3 sm:max-w-xl sm:mx-auto">
        <div className="relative px-4 py-10 bg-white mx-8 md:mx-0 shadow rounded-3xl sm:p-10">
          <div className="max-w-md mx-auto">
            <div className="flex items-center space-x-5">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center text-blue-600 hover:text-blue-800"
              >
                <FiArrowLeft className="h-5 w-5 mr-1" />
                Back
              </button>
            </div>
            <div className="divide-y divide-gray-200">
              <div className="py-8 text-base leading-6 space-y-4 text-gray-700 sm:text-lg sm:leading-7">
                <div className="flex items-center space-x-4">
                  <FiUser className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="font-medium">Patient</p>
                    <p>{prescription.patient_name}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <FiUser className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="font-medium">Doctor</p>
                    <p>{prescription.doctor_name}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <FiCalendar className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="font-medium">Date</p>
                    <p>{formatDate(prescription.date)}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <FiClock className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="font-medium">Status</p>
                    <p className={`capitalize ${
                      prescription.status === 'pending' ? 'text-yellow-600' :
                      prescription.status === 'dispensed' ? 'text-green-600' :
                      'text-red-600'
                    }`}>
                      {prescription.status}
                    </p>
                  </div>
                </div>
                {prescription.notes && (
                  <div className="mt-4">
                    <p className="font-medium">Notes</p>
                    <p className="text-gray-600">{prescription.notes}</p>
                  </div>
                )}
                <div className="mt-6">
                  <h3 className="text-lg font-medium text-gray-900">Medications</h3>
                  <div className="mt-4 space-y-4">
                    {prescription.drugs.map((drug, index) => (
                      <div
                        key={index}
                        className="bg-gray-50 rounded-lg p-4"
                      >
                        <div className="flex items-center space-x-3">
                          <FiPackage className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="font-medium text-gray-900">{drug.drug_name}</p>
                            <p className="text-sm text-gray-500">Quantity: {drug.quantity}</p>
                            {drug.drug_description && (
                              <p className="text-sm text-gray-500 mt-1">{drug.drug_description}</p>
                            )}
                          </div>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
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
                          <p className="text-sm text-gray-500 mt-2">
                            Notes: {drug.notes}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrescriptionDetails; 