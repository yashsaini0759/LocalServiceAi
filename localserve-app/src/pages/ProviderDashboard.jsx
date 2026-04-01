import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function ProviderDashboard() {
  const { user, token } = useAuth();
  const { providers, setProviders } = useApp();
  const navigate = useNavigate();
  
  const [profile, setProfile] = useState({ available: true });
  const [services, setServices] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [serviceForm, setServiceForm] = useState({
    category: "Handyman",
    experience: "1 year",
    price: 0,
    description: ""
  });

  const categories = [
    "Handyman", "Plumbing", "Cleaning", "Electrician", "IT Support", "Tutor", "Beauty & Salon", "Cooking", "Moving", "Other"
  ];

  useEffect(() => {
    if (!user) navigate("/auth?mode=login");
    else if (user.role !== "provider") navigate("/dashboard");
    else {
      const existing = providers.find(p => p.userId === user.id);
      if (existing) {
        setProfile({ available: existing.available !== false });
      }
      fetchServices();
    }
  }, [user, navigate, providers]);

  const fetchServices = async () => {
    try {
      const res = await fetch(`${API_URL}/providers/services`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setServices(data);
      }
    } catch (err) {
      console.error("Failed to fetch services", err);
    }
  };

  if (!user || user.role !== "provider") return null;

  // Save global profile status (Availability)
  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/providers/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ available: profile.available })
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
        const updated = await res.json();
        setProviders(prev => prev.map(p => p.userId === user.id ? { ...p, ...updated } : p));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileChange = (e) => {
    const { checked } = e.target;
    setProfile({ available: checked });
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setServiceForm(prev => ({ ...prev, [name]: value }));
  };

  const openNewForm = () => {
    setEditingId(null);
    setServiceForm({ category: "Handyman", experience: "1 year", price: 0, description: "" });
    setShowForm(true);
  };

  const openEditForm = (service) => {
    setEditingId(service.id);
    setServiceForm({
      category: service.category,
      experience: service.experience,
      price: service.price,
      description: service.description
    });
    setShowForm(true);
  };

  const saveService = async () => {
    try {
      const isEdit = !!editingId;
      const endpoint = isEdit 
        ? `${API_URL}/providers/services/${editingId}`
        : `${API_URL}/providers/services`;
        
      const res = await fetch(endpoint, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(serviceForm)
      });
      
      if (res.ok) {
        await fetchServices();
        setShowForm(false);
      }
    } catch (err) {
      console.error("Failed to save service", err);
    }
  };

  const deleteService = async (id) => {
    if(!window.confirm("Are you sure you want to delete this service?")) return;
    try {
      const res = await fetch(`${API_URL}/providers/services/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) fetchServices();
    } catch (err) {
      console.error("Failed to delete", err);
    }
  };

  return (
    <div className="min-h-screen bg-background pt-20">
      <div className="bg-gradient-to-r from-primary/90 to-primary py-12 px-6 md:px-8 shadow-inner text-white">
        <div className="max-w-4xl mx-auto flex items-center gap-6">
          <img src={user.avatar} alt={user.name} className="w-20 h-20 rounded-full bg-surface-container border-4 border-white/30 shadow-lg object-cover" />
          <div>
            <h1 className="text-2xl md:text-3xl font-headline font-extrabold tracking-tight">Provider Dashboard</h1>
            <p className="text-white/80 text-sm mt-1 font-medium">Manage your professional services and availability.</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 md:px-8 py-10 space-y-8">
        
        {/* Global Profile Settings */}
        <div className="bg-white rounded-2xl border border-outline-variant/20 shadow-sm overflow-hidden p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-on-surface">Global Profile Status</h2>
            <p className="text-sm text-on-surface-variant">Toggle whether you are accepting new jobs globally.</p>
          </div>
          <div className="flex items-center gap-4">
            <span className={`text-sm font-bold ${profile.available ? 'text-green-600' : 'text-on-surface-variant'}`}>
              {profile.available ? "Accepting Jobs" : "Unavailable"}
            </span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={profile.available} 
                onChange={handleProfileChange} 
                className="sr-only peer" 
              />
              <div className="w-12 h-7 bg-surface-container-high rounded-full peer peer-checked:bg-primary transition-all shadow-inner">
                <div className={`absolute top-1 left-1 bg-white w-5 h-5 rounded-full shadow transition-transform ${profile.available ? 'translate-x-5' : ''}`}></div>
              </div>
            </label>
            <button 
              onClick={handleSaveProfile}
              disabled={loading}
              className="bg-primary/10 text-primary px-4 py-2 rounded-xl font-bold text-sm hover:bg-primary/20 transition-colors"
            >
              {saved ? "Saved!" : "Save Status"}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-on-surface font-headline">My Services</h2>
            {!showForm && (
              <button 
                onClick={openNewForm}
                className="bg-primary text-on-primary px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-primary-dim transition-all shadow hover:shadow-md flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                Add New Service
              </button>
            )}
        </div>

        {/* Service Form */}
        {showForm && (
          <div className="bg-white rounded-2xl border border-outline-variant/20 shadow-lg overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="p-6 border-b border-outline-variant/10 bg-surface-container-lowest">
              <h2 className="text-xl font-bold text-on-surface">{editingId ? "Edit Service" : "Add New Service"}</h2>
              <p className="text-sm text-on-surface-variant">Fill in the details for the specific service you offer.</p>
            </div>
            <div className="p-6 space-y-6 bg-white">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Service Category</label>
                  <select 
                    name="category"
                    value={serviceForm.category} 
                    onChange={handleFormChange}
                    className="w-full border border-outline-variant/30 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all bg-white" 
                  >
                    {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Years of Experience</label>
                  <input 
                    type="text" 
                    name="experience"
                    value={serviceForm.experience} 
                    onChange={handleFormChange}
                    placeholder="e.g. 5+ Years"
                    className="w-full border border-outline-variant/30 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" 
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Starting Price (₹)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant font-bold">₹</span>
                  <input 
                    type="number" 
                    name="price"
                    value={serviceForm.price} 
                    onChange={handleFormChange}
                    placeholder="500"
                    className="w-full border border-outline-variant/30 rounded-xl pl-9 pr-4 py-3 text-sm font-medium focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" 
                  />
                </div>
                <p className="text-xs text-on-surface-variant">Shown as "Starting from ₹X" for this specific service.</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Professional Bio</label>
                <textarea 
                  rows={4}
                  name="description"
                  value={serviceForm.description} 
                  onChange={handleFormChange}
                  className="w-full border border-outline-variant/30 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-y" 
                  placeholder="Describe your expertise and what makes your service stand out..."
                />
              </div>
            </div>

            <div className="p-6 bg-surface-container-low border-t border-outline-variant/10 flex items-center justify-end gap-3">
              <button 
                onClick={() => setShowForm(false)}
                className="px-6 py-2.5 rounded-xl font-bold text-sm text-on-surface-variant hover:bg-surface-container-highest transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={saveService}
                className="bg-primary text-on-primary px-8 py-2.5 rounded-xl font-bold text-sm hover:bg-primary-dim transition-all shadow hover:shadow-md"
              >
                {editingId ? "Update Service" : "Save Service"}
              </button>
            </div>
          </div>
        )}

        {/* Existing Services List */}
        {!showForm && services.length === 0 && (
          <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-outline-variant/40">
            <h3 className="text-lg font-bold text-on-surface">No services added yet</h3>
            <p className="text-sm text-on-surface-variant mt-1 mb-4">You need to add at least one service to appear in searches.</p>
            <button onClick={openNewForm} className="text-primary font-bold hover:underline">Add your first service</button>
          </div>
        )}

        {!showForm && services.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {services.map(service => (
              <div key={service.id} className="bg-white rounded-2xl border border-outline-variant/20 shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden group flex flex-col">
                <div className="p-6 flex-1">
                  <div className="flex justify-between items-start mb-4">
                    <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider">
                      {service.category}
                    </span>
                    <span className="font-bold text-on-surface bg-surface-container px-3 py-1 rounded-lg">
                      ₹{service.price}
                    </span>
                  </div>
                  <h3 className="text-on-surface font-medium text-sm line-clamp-3 leading-relaxed opacity-90">
                    {service.description || "No description provided."}
                  </h3>
                  <div className="mt-5 pt-4 border-t border-outline-variant/10 flex items-center gap-2 text-sm text-on-surface-variant">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    <span className="font-semibold">{service.experience} Experience</span>
                  </div>
                </div>
                <div className="bg-surface-container-lowest border-t border-outline-variant/10 px-4 py-3 flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEditForm(service)} className="text-sm font-bold text-primary hover:bg-primary/10 px-4 py-1.5 rounded-lg transition-colors">
                    Edit
                  </button>
                  <button onClick={() => deleteService(service.id)} className="text-sm font-bold text-red-600 hover:bg-red-50 px-4 py-1.5 rounded-lg transition-colors">
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
