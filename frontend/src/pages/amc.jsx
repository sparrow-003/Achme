import React, { useState, useEffect } from "react";
import "../Styles/tailwind.css";
import { Search, Plus, X, TrendingUp, DollarSign, Wrench, FileText } from "lucide-react";
import axios from "axios";

const AMCService = () => {
  const [open, setOpen] = useState(false);
  const [services, setServices] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isEdit, setIsEdit] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState(null);

  // Form state
  const [form, setForm] = useState({
    contract_id: "",
    service_type: "AMC",
    customer_name: "",
    mobile_number: "",
    location_city: "",
    service_date: new Date().toISOString().slice(0, 10),
    service_person: "",
    description: "",
    petrol_charges: "",
    spare_parts_price: "",
    total_expenses: "",
    status: "Completed"
  });

  // Fetch data
  const fetchServices = async () => {
    try {
      const res = await axios.get("http://localhost:3000/api/amc/amc-alc");
      setServices(res.data);
    } catch (err) {
      console.error("Fetch services error:", err);
    }
  };

  const fetchContracts = async () => {
    try {
      const res = await axios.get("http://localhost:3000/api/contract");
      // Filter for AMC/ALC contracts
      const amcContracts = res.data.filter(c => c.contract_type === 'AMC' || c.contract_type === 'ALC');
      setContracts(amcContracts);
    } catch (err) {
      console.error("Fetch contracts error:", err);
    }
  };

  useEffect(() => {
    fetchServices();
    fetchContracts();
  }, []);

  // Handle form changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });

    // Auto-fill customer details when contract is selected
    if (name === 'contract_id' && value) {
      const selectedContract = contracts.find(c => c.id === parseInt(value));
      if (selectedContract) {
        setForm(prev => ({
          ...prev,
          contract_id: value,
          customer_name: selectedContract.client_company || "",
          service_type: selectedContract.contract_type
        }));
      }
    }
  };

  // Calculate total expenses
  useEffect(() => {
    const petrol = parseFloat(form.petrol_charges) || 0;
    const spare = parseFloat(form.spare_parts_price) || 0;
    const total = petrol + spare;
    setForm(prev => ({ ...prev, total_expenses: total.toString() }));
  }, [form.petrol_charges, form.spare_parts_price]);

  // Save service
  const saveService = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        petrol_charges: parseFloat(form.petrol_charges) || 0,
        spare_parts_price: parseFloat(form.spare_parts_price) || 0,
        total_expenses: parseFloat(form.total_expenses) || 0
      };

      if (isEdit && selectedServiceId) {
        await axios.put(`http://localhost:3000/api/amc/amc-alc/${selectedServiceId}`, payload);
        alert("Service updated successfully!");
      } else {
        await axios.post("http://localhost:3000/api/amc/amc-alc", payload);
        alert("Service recorded successfully!");
      }

      setOpen(false);
      resetForm();
      fetchServices();
    } catch (err) {
      alert("Failed to save service: " + (err.response?.data?.error || err.message));
    }
  };

  // Edit service
  const openEdit = (service) => {
    setForm({
      contract_id: service.contract_id,
      service_type: service.service_type,
      customer_name: service.customer_name || "",
      mobile_number: service.mobile_number || "",
      location_city: service.location_city || "",
      service_date: service.service_date?.split("T")[0] || "",
      service_person: service.service_person || "",
      description: service.description || "",
      petrol_charges: service.petrol_charges?.toString() || "",
      spare_parts_price: service.spare_parts_price?.toString() || "",
      total_expenses: service.total_expenses?.toString() || "",
      status: service.status || "Completed"
    });
    setSelectedServiceId(service.id);
    setIsEdit(true);
    setOpen(true);
  };

  // Delete service
  const deleteService = async (id) => {
    if (!window.confirm("Delete this service record?")) return;
    try {
      await axios.delete(`http://localhost:3000/api/amc/amc-alc/${id}`);
      fetchServices();
    } catch (err) {
      alert("Failed to delete service");
    }
  };

  // Reset form
  const resetForm = () => {
    setForm({
      contract_id: "",
      service_type: "AMC",
      customer_name: "",
      mobile_number: "",
      location_city: "",
      service_date: new Date().toISOString().slice(0, 10),
      service_person: "",
      description: "",
      petrol_charges: "",
      spare_parts_price: "",
      total_expenses: "",
      status: "Completed"
    });
    setIsEdit(false);
    setSelectedServiceId(null);
  };

  // Filter services
  const filteredServices = services.filter(s =>
    s.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.contract_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.service_person?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate totals
  const totalPetrol = filteredServices.reduce((sum, s) => sum + (parseFloat(s.petrol_charges) || 0), 0);
  const totalSpareParts = filteredServices.reduce((sum, s) => sum + (parseFloat(s.spare_parts_price) || 0), 0);
  const totalExpenses = filteredServices.reduce((sum, s) => sum + (parseFloat(s.total_expenses) || 0), 0);

  return (
    <div className="w-full p-4">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-[#1694CE]">AMC/ALC Service Management</h1>
        <a className="text-sm text-gray-500" href="/dashboard">Dashboard > AMC/ALC Services</a>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <Wrench className="text-blue-600" size={24} />
            <div>
              <p className="text-sm text-blue-600 font-medium">Total Services</p>
              <p className="text-2xl font-bold text-blue-700">{filteredServices.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <DollarSign className="text-green-600" size={24} />
            <div>
              <p className="text-sm text-green-600 font-medium">Total Expenses</p>
              <p className="text-2xl font-bold text-green-700">₹{totalExpenses.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <TrendingUp className="text-orange-600" size={24} />
            <div>
              <p className="text-sm text-orange-600 font-medium">Petrol Charges</p>
              <p className="text-2xl font-bold text-orange-700">₹{totalPetrol.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <FileText className="text-purple-600" size={24} />
            <div>
              <p className="text-sm text-purple-600 font-medium">Spare Parts</p>
              <p className="text-2xl font-bold text-purple-700">₹{totalSpareParts.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Add */}
      <div className="bg-[#F3F8FA] p-4 rounded-xl flex justify-between items-center shadow mb-6">
        <div className="flex items-center gap-3 bg-white px-3 py-2 rounded-lg shadow border w-80">
          <Search size={18} className="text-gray-500" />
          <input
            type="text"
            placeholder="Search by customer, contract, or service person..."
            className="outline-none text-sm w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button
          onClick={() => { resetForm(); setOpen(true); }}
          className="bg-[#FF3355] text-white w-12 h-12 rounded-full flex justify-center items-center shadow-lg hover:bg-[#e62848]"
        >
          <Plus size={24} />
        </button>
      </div>

      {/* Services Table */}
      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead className="bg-gray-50">
            <tr className="text-xs uppercase text-gray-500 font-bold border-b">
              <th className="p-3 text-left">Date</th>
              <th className="p-3 text-left">Contract</th>
              <th className="p-3 text-left">Customer</th>
              <th className="p-3 text-center">Type</th>
              <th className="p-3 text-left">Service Person</th>
              <th className="p-3 text-right">Petrol (₹)</th>
              <th className="p-3 text-right">Spare Parts (₹)</th>
              <th className="p-3 text-right">Total (₹)</th>
              <th className="p-3 text-center">Status</th>
              <th className="p-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredServices.length === 0 ? (
              <tr>
                <td colSpan="10" className="py-10 text-gray-400 text-center">
                  No AMC/ALC services found
                </td>
              </tr>
            ) : (
              filteredServices.map(s => (
                <tr key={s.id} className="border-b hover:bg-gray-50">
                  <td className="p-3">{new Date(s.service_date).toLocaleDateString()}</td>
                  <td className="p-3 font-medium">{s.contract_title}</td>
                  <td className="p-3">{s.customer_name}</td>
                  <td className="p-3 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                      s.service_type === 'AMC' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                    }`}>
                      {s.service_type}
                    </span>
                  </td>
                  <td className="p-3">{s.service_person || "---"}</td>
                  <td className="p-3 text-right">₹{(parseFloat(s.petrol_charges) || 0).toLocaleString()}</td>
                  <td className="p-3 text-right">₹{(parseFloat(s.spare_parts_price) || 0).toLocaleString()}</td>
                  <td className="p-3 text-right font-bold">₹{(parseFloat(s.total_expenses) || 0).toLocaleString()}</td>
                  <td className="p-3 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      s.status === 'Completed' ? 'bg-green-100 text-green-700' :
                      s.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <div className="flex gap-2 justify-center">
                      <button
                        onClick={() => openEdit(s)}
                        className="text-blue-600 hover:underline text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteService(s.id)}
                        className="text-red-600 hover:underline text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">{isEdit ? "Edit Service" : "Add AMC/ALC Service"}</h2>
              <X className="cursor-pointer" onClick={() => setOpen(false)} />
            </div>

            <form onSubmit={saveService} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Contract *</label>
                  <select
                    name="contract_id"
                    value={form.contract_id}
                    onChange={handleChange}
                    className="w-full border rounded-lg p-2 mt-1"
                    required
                  >
                    <option value="">Select Contract</option>
                    {contracts.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.contract_title} - {c.contract_type} (₹{c.amount_value})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Service Type</label>
                  <select
                    name="service_type"
                    value={form.service_type}
                    onChange={handleChange}
                    className="w-full border rounded-lg p-2 mt-1"
                  >
                    <option value="AMC">AMC (Annual Maintenance)</option>
                    <option value="ALC">ALC (Annual Labour)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Customer Name</label>
                  <input
                    type="text"
                    name="customer_name"
                    value={form.customer_name}
                    onChange={handleChange}
                    className="w-full border rounded-lg p-2 mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Mobile Number</label>
                  <input
                    type="text"
                    name="mobile_number"
                    value={form.mobile_number}
                    onChange={handleChange}
                    className="w-full border rounded-lg p-2 mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Location/City</label>
                  <input
                    type="text"
                    name="location_city"
                    value={form.location_city}
                    onChange={handleChange}
                    className="w-full border rounded-lg p-2 mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Service Date *</label>
                  <input
                    type="date"
                    name="service_date"
                    value={form.service_date}
                    onChange={handleChange}
                    className="w-full border rounded-lg p-2 mt-1"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">Service Person</label>
                <input
                  type="text"
                  name="service_person"
                  value={form.service_person}
                  onChange={handleChange}
                  className="w-full border rounded-lg p-2 mt-1"
                  placeholder="Who performed the service?"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">Service Description</label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  className="w-full border rounded-lg p-2 mt-1"
                  rows={3}
                  placeholder="Describe the service performed..."
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Petrol Charges (₹)</label>
                  <input
                    type="number"
                    name="petrol_charges"
                    value={form.petrol_charges}
                    onChange={handleChange}
                    className="w-full border rounded-lg p-2 mt-1"
                    placeholder="0.00"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Spare Parts (₹)</label>
                  <input
                    type="number"
                    name="spare_parts_price"
                    value={form.spare_parts_price}
                    onChange={handleChange}
                    className="w-full border rounded-lg p-2 mt-1"
                    placeholder="0.00"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Total Expenses (₹)</label>
                  <input
                    type="number"
                    name="total_expenses"
                    value={form.total_expenses}
                    readOnly
                    className="w-full border rounded-lg p-2 mt-1 bg-gray-50"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">Status</label>
                <select
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  className="w-full border rounded-lg p-2 mt-1"
                >
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>

              <div className="flex gap-2 pt-4">
                <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">
                  {isEdit ? "Update Service" : "Save Service"}
                </button>
                <button type="button" onClick={() => setOpen(false)} className="flex-1 bg-gray-300 py-2 rounded-lg hover:bg-gray-400">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AMCService;