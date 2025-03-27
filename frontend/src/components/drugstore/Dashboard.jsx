import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import {
  FiHome,
  FiFileText,
  FiArrowRight,
  FiAlertCircle,
  FiUser,
  FiPackage
} from 'react-icons/fi';

const Dashboard = () => {
  const [drugs, setDrugs] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [drugsRes, prescriptionsRes] = await Promise.all([
        axios.get('http://localhost:5001/api/drugs'),
        axios.get('http://localhost:5001/api/drugs/recent-prescriptions')
      ]);

      setDrugs(drugsRes.data);
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
        <h2 className="text-2xl font-bold text-gray-900">Drugstore Dashboard</h2>
        <p className="mt-1 text-sm text-gray-500">
          Manage drugs and process prescriptions
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          to="/drugstore/drugs"
          className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FiPackage className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">Manage Drugs</h3>
                <p className="text-sm text-gray-500">Update drug inventory</p>
              </div>
            </div>
            <FiArrowRight className="h-5 w-5 text-gray-400" />
          </div>
        </Link>

        <Link
          to="/drugstore/prescriptions"
          className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <FiFileText className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">Recent Prescriptions</h3>
                <p className="text-sm text-gray-500">Process prescriptions</p>
              </div>
            </div>
            <FiArrowRight className="h-5 w-5 text-gray-400" />
          </div>
        </Link>
      </div>

      {/* Drug Inventory Summary */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900">Drug Inventory</h3>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            {drugs.map((drug) => (
              <div
                key={drug.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <FiPackage className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{drug.name}</h4>
                    <p className="text-sm text-gray-500">
                      Available: {drug.quantity}
                    </p>
                  </div>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    drug.quantity > 10
                      ? 'bg-green-100 text-green-800'
                      : drug.quantity > 5
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {drug.quantity > 10
                    ? 'In Stock'
                    : drug.quantity > 5
                    ? 'Low Stock'
                    : 'Critical'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Prescriptions */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900">Recent Prescriptions</h3>
          <div className="mt-4 space-y-4">
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
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-sm text-gray-500">
                      {formatDate(prescription.date)}
                    </div>
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

export default Dashboard; 