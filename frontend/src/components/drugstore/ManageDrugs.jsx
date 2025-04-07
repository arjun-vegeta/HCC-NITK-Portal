import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiAlertCircle,
  FiLoader,
  FiPackage
} from 'react-icons/fi';

const ManageDrugs = () => {
  const [drugs, setDrugs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDrug, setEditingDrug] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    quantity: '',
    price: '',
    expiry_date: ''
  });
  const { user } = useAuth();

  useEffect(() => {
    // Reset the Authorization header explicitly with a slight delay
    setTimeout(() => {
      const token = localStorage.getItem('token');
      if (token) {
        console.log('ManageDrugs: Setting Authorization header before API calls');
        axios.defaults.headers.common['Authorization'] = `Bearer ${token.trim()}`;
      }
      
      if (user) {
        fetchDrugs();
      }
    }, 100);
  }, [user]);

  const fetchDrugs = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Debug token
      const token = localStorage.getItem('token');
      console.log('ManageDrugs: Token exists:', token ? 'Yes' : 'No');
      console.log('ManageDrugs: Token in axios defaults:', axios.defaults.headers.common['Authorization'] ? 'Yes' : 'No');
      
      if (!token) {
        setError('Authentication token missing. Please login again.');
        setLoading(false);
        return;
      }
      
      // Clean the token and set headers directly
      const cleanToken = token.trim();
      console.log('ManageDrugs: Clean token length:', cleanToken.length);
      
      // Set headers directly for this request
      const headers = { 'Authorization': `Bearer ${cleanToken}` };
      
      console.log('ManageDrugs: Fetching drugs...');
      const response = await axios.get('/api/drugs', { headers });
      console.log('ManageDrugs: Successfully fetched drugs:', response.data.length);
      setDrugs(response.data);
    } catch (err) {
      console.error('Error fetching drugs:', err);
      if (err.response) {
        console.error('API error status:', err.response.status);
        console.error('API error data:', err.response.data);
        setError(`Error: ${err.response.data.message || 'Failed to fetch drugs'}`);
      } else if (err.request) {
        setError('Server not responding. Please check your connection and try again.');
      } else {
        setError(`Error: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError('');
      
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
      
      console.log(`ManageDrugs: ${editingDrug ? 'Updating' : 'Creating'} drug ${formData.name}`);
      
      if (editingDrug) {
        await axios.patch(`/api/drugs/${editingDrug.id}`, formData, { headers });
      } else {
        await axios.post('/api/drugs', formData, { headers });
      }
      
      console.log('ManageDrugs: Drug saved successfully');
      setIsModalOpen(false);
      setEditingDrug(null);
      setFormData({
        name: '',
        description: '',
        quantity: '',
        price: '',
        expiry_date: ''
      });
      fetchDrugs();
    } catch (err) {
      console.error('Error saving drug:', err);
      if (err.response) {
        console.error('API error status:', err.response.status);
        console.error('API error data:', err.response.data);
        setError(`Error: ${err.response.data.message || 'Failed to save drug'}`);
      } else if (err.request) {
        setError('Server not responding. Please check your connection and try again.');
      } else {
        setError(`Error: ${err.message}`);
      }
    }
  };

  const handleEdit = (drug) => {
    setEditingDrug(drug);
    setFormData({
      name: drug.name,
      description: drug.description,
      quantity: drug.quantity,
      price: drug.price,
      expiry_date: drug.expiry_date
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (drugId) => {
    if (window.confirm('Are you sure you want to delete this drug?')) {
      try {
        setError('');
        
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
        
        console.log(`ManageDrugs: Deleting drug with ID ${drugId}`);
        await axios.delete(`/api/drugs/${drugId}`, { headers });
        console.log('ManageDrugs: Drug deleted successfully');
        fetchDrugs();
      } catch (err) {
        console.error('Error deleting drug:', err);
        if (err.response) {
          console.error('API error status:', err.response.status);
          console.error('API error data:', err.response.data);
          setError(`Error: ${err.response.data.message || 'Failed to delete drug'}`);
        } else if (err.request) {
          setError('Server not responding. Please check your connection and try again.');
        } else {
          setError(`Error: ${err.message}`);
        }
      }
    }
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
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Manage Drugs</h2>
          <p className="mt-1 text-sm text-gray-500">
            Add, edit, and manage drug inventory
          </p>
        </div>
        <button
          onClick={() => {
            setEditingDrug(null);
            setFormData({
              name: '',
              description: '',
              quantity: '',
              price: '',
              expiry_date: ''
            });
            setIsModalOpen(true);
          }}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <FiPlus className="h-4 w-4 mr-2" />
          Add Drug
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {drugs.map((drug) => (
              <div
                key={drug.id}
                className="bg-gray-50 rounded-lg p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <FiPackage className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{drug.name}</h3>
                      <p className="text-sm text-gray-500">
                        Quantity: {drug.quantity}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleEdit(drug)}
                      className="p-1 text-gray-400 hover:text-blue-600"
                    >
                      <FiEdit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(drug.id)}
                      className="p-1 text-gray-400 hover:text-red-600"
                    >
                      <FiTrash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="mt-2">
                  <p className="text-sm text-gray-600">{drug.description}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Price: ${drug.price}
                  </p>
                  <p className="text-sm text-gray-500">
                    Expires: {new Date(drug.expiry_date).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {editingDrug ? 'Edit Drug' : 'Add New Drug'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  rows="3"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Quantity
                </label>
                <input
                  type="number"
                  value={formData.quantity}
                  onChange={(e) =>
                    setFormData({ ...formData, quantity: e.target.value })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Price
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: e.target.value })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Expiry Date
                </label>
                <input
                  type="date"
                  value={formData.expiry_date}
                  onChange={(e) =>
                    setFormData({ ...formData, expiry_date: e.target.value })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  {editingDrug ? 'Update' : 'Add'} Drug
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageDrugs; 