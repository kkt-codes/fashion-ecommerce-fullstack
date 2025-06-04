import React, { useState, useEffect } from "react";
import Sidebar from "../../components/Sidebar";
import apiClient from "../../services/api";
import toast from "react-hot-toast";
import { Cog6ToothIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";

export default function AdminSettings() {
  // Example settings state (extend as needed)
  const [settings, setSettings] = useState({
    siteMaintenanceMode: false, // Example setting toggle
    supportEmail: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Load settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      setLoading(true);
      setError(null);
      try {
        // Backend endpoint assumed: GET /admin/settings
        const response = await apiClient.get("/admin/settings");
        if (response.data) {
          setSettings({
            siteMaintenanceMode: !!response.data.siteMaintenanceMode,
            supportEmail: response.data.supportEmail || "",
          });
        } else {
          throw new Error("No settings data found");
        }
      } catch (err) {
        console.error("Failed to load admin settings:", err.response?.data || err.message);
        setError(err.response?.data?.message || "Failed to load settings.");
        toast.error("Failed to load settings.");
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  const handleToggleMaintenanceMode = () => {
    setSettings((prev) => ({
      ...prev,
      siteMaintenanceMode: !prev.siteMaintenanceMode,
    }));
  };

  const handleSupportEmailChange = (e) => {
    setSettings((prev) => ({
      ...prev,
      supportEmail: e.target.value,
    }));
  };

  const validateEmail = (email) => {
    // Basic email regex
    return /^\S+@\S+\.\S+$/.test(email);
  };

  const handleSaveSettings = async () => {
    if (settings.supportEmail && !validateEmail(settings.supportEmail)) {
      toast.error("Please enter a valid support email.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      // Backend endpoint assumed: PUT /admin/settings
      // Sending entire settings payload, adjust as per backend API contract
      await apiClient.put("/admin/settings", settings);
      toast.success("Settings updated successfully!");
    } catch (err) {
      console.error("Failed to update settings:", err.response?.data || err.message);
      const errMsg = err.response?.data?.message || "Failed to update settings.";
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <main className="flex-1 p-6 sm:p-8 max-w-4xl mx-auto">
        <header className="mb-6 flex items-center gap-3">
          <Cog6ToothIcon className="h-8 w-8 text-gray-700" />
          <h1 className="text-3xl font-bold text-gray-800">Admin Settings</h1>
        </header>

        {loading ? (
          <p className="text-gray-600 animate-pulse">Loading settings...</p>
        ) : error ? (
          <div className="p-4 mb-6 bg-red-100 text-red-700 rounded shadow text-center flex items-center gap-2 justify-center">
            <ExclamationTriangleIcon className="h-6 w-6" />
            <span>{error}</span>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-6 space-y-6">
            
            <div className="flex items-center justify-between">
              <label
                htmlFor="maintenanceMode"
                className="text-gray-700 font-medium"
                title="Enable or disable site maintenance mode"
              >
                Site Maintenance Mode
              </label>
              <input
                id="maintenanceMode"
                type="checkbox"
                checked={settings.siteMaintenanceMode}
                onChange={handleToggleMaintenanceMode}
                className="h-5 w-5 cursor-pointer rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="supportEmail" className="block mb-1 font-medium text-gray-700">
                Support Email Address
              </label>
              <input
                id="supportEmail"
                type="email"
                value={settings.supportEmail}
                onChange={handleSupportEmailChange}
                placeholder="support@example.com"
                className="w-full max-w-md rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>

            <div>
              <button
                onClick={handleSaveSettings}
                disabled={saving}
                className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-70 transition-colors"
              >
                {saving ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                    </svg>
                    Saving...
                  </>
                ) : (
                  'Save Settings'
                )}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
