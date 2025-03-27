import { useState, useEffect } from 'react';
import axios from 'axios';
import { FiUser, FiPackage, FiAlertCircle, FiPlus, FiX } from 'react-icons/fi';

const WritePrescription = () => {
  const [patients, setPatients] = useState([]);
  const [drugs, setDrugs] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState('');
  const [notes, setNotes] = useState('');
  const [prescriptionDrugs, setPrescriptionDrugs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [patientsRes, drugsRes] = await Promise.all([
        axios.get('http://localhost:5001/api/users?role=student'),
        axios.get('http://localhost:5001/api/drugs')
      ]);

      setPatients(patientsRes.data);
      setDrugs(drugsRes.data);
    } catch (err) {
      setError('Failed to fetch data');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddDrug = () => {
    setPrescriptionDrugs([
      ...prescriptionDrugs,
      {
        drug_id: '',
        quantity: 1,
        morning: false,
        noon: false,
        evening: false,
        night: false,
        notes: ''
      }
    ]);
  };

  const handleRemoveDrug = (index) => {
    setPrescriptionDrugs(prescriptionDrugs.filter((_, i) => i !== index));
  };

  const handleDrugChange = (index, field, value) => {
    const updatedDrugs = [...prescriptionDrugs];
    updatedDrugs[index] = {
      ...updatedDrugs[index],
      [field]: value
    };
    setPrescriptionDrugs(updatedDrugs);
  };

  const handleSubmit = async () => {
    try {
      if (!selectedPatient) {
        setError('Please select a patient');
        return;
      }

      if (prescriptionDrugs.length === 0) {
        setError('Please add at least one medication');
        return;
      }

      const validDrugs = prescriptionDrugs.filter(drug => drug.drug_id);

      if (validDrugs.length === 0) {
        setError('Please select at least one medication');
        return;
      }

      await axios.post('http://localhost:5001/api/prescriptions', {
        patient_id: selectedPatient,
        notes,
        drugs: validDrugs
      });

      setSuccess('Prescription created successfully!');
      setSelectedPatient('');
      setNotes('');
      setPrescriptionDrugs([]);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create prescription');
    }
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
        <h2 className="text-2xl font-bold text-gray-900">Write Prescription</h2>
        <p className="mt-1 text-sm text-gray-500">
          Create a new prescription for a patient
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
        {/* Patient Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Select Patient
          </label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiUser className="h-5 w-5 text-gray-400" />
            </div>
            <select
              value={selectedPatient}
              onChange={(e) => setSelectedPatient(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            >
              <option value="">Select a patient</option>
              {patients.map((patient) => (
                <option key={patient.id} value={patient.id}>
                  {patient.name} ({patient.batch} • {patient.branch})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Notes
          </label>
          <div className="mt-1">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="block w-full border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              placeholder="Add any additional notes or instructions..."
            />
          </div>
        </div>

        {/* Medications */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Medications</h3>
            <button
              onClick={handleAddDrug}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <FiPlus className="h-4 w-4 mr-1" />
              Add Medication
            </button>
          </div>

          <div className="space-y-4">
            {prescriptionDrugs.map((drug, index) => (
              <div
                key={index}
                className="border rounded-lg p-4 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-900">
                    Medication {index + 1}
                  </h4>
                  <button
                    onClick={() => handleRemoveDrug(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <FiX className="h-5 w-5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Select Drug
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FiPackage className="h-5 w-5 text-gray-400" />
                      </div>
                      <select
                        value={drug.drug_id}
                        onChange={(e) => handleDrugChange(index, 'drug_id', e.target.value)}
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                      >
                        <option value="">Select a drug</option>
                        {drugs.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name} (Available: {d.quantity})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Quantity
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={drug.quantity}
                      onChange={(e) => handleDrugChange(index, 'quantity', parseInt(e.target.value))}
                      className="mt-1 block w-full border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Timing
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {['morning', 'noon', 'evening', 'night'].map((time) => (
                      <label
                        key={time}
                        className="flex items-center space-x-2"
                      >
                        <input
                          type="checkbox"
                          checked={drug[time]}
                          onChange={(e) => handleDrugChange(index, time, e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="text-sm text-gray-700 capitalize">
                          {time}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Notes
                  </label>
                  <input
                    type="text"
                    value={drug.notes}
                    onChange={(e) => handleDrugChange(index, 'notes', e.target.value)}
                    className="mt-1 block w-full border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                    placeholder="Add any specific instructions for this medication..."
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <div>
          <button
            onClick={handleSubmit}
            disabled={!selectedPatient || prescriptionDrugs.length === 0}
            className="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Create Prescription
          </button>
        </div>
      </div>
    </div>
  );
};

export default WritePrescription; 