import React, { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import { Cog6ToothIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";

import Sidebar from "../../components/Sidebar";
import { getAdminSettings, updateAdminSettings } from "../../services/api";

export default function AdminSettings() {
  const [settings, setSettings] = useState({ siteMaintenanceMode: false, supportEmail: "" });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  const fetchSettings = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data } = await getAdminSettings();
      setSettings({
        siteMaintenanceMode: !!data.siteMaintenanceMode,
        supportEmail: data.supportEmail || "",
      });
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Failed to load settings.";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSaveSettings = async () => {
    if (settings.supportEmail && !/^\S+@\S+\.\S+$/.test(settings.supportEmail)) {
      toast.error("Please enter a valid support email address.");
      return;
    }

    setIsSaving(true);
    const toastId = toast.loading("Saving settings...");
    try {
      await updateAdminSettings(settings);
      toast.success("Settings updated successfully!", { id: toastId });
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Failed to update settings.";
      setError(errorMsg);
      toast.error(errorMsg, { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return <p className="text-gray-600 animate-pulse">Loading settings...</p>;
    }
    if (error) {
      return (
        <div className="p-4 bg-red-100 text-red-700 rounded shadow text-center flex items-center gap-2 justify-center">
          <ExclamationTriangleIcon className="h-6 w-6" />
          <span>{error}</span>
          <button onClick={fetchSettings} className="ml-4 px-3 py-1 text-sm bg-red-200 text-red-800 rounded hover:bg-red-300">Retry</button>
        </div>
      );
    }
    return (
      <div className="bg-white rounded-lg shadow-xl p-8 space-y-8">
        <div className="flex items-center justify-between pb-4 border-b border-gray-200">
          <div>
            <label htmlFor="siteMaintenanceMode" className="text-lg font-medium text-gray-900">Site Maintenance Mode</label>
            <p className="text-sm text-gray-500 mt-1">When enabled, only admins can access the site.</p>
          </div>
          <label htmlFor="siteMaintenanceMode" className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              id="siteMaintenanceMode"
              name="siteMaintenanceMode"
              checked={settings.siteMaintenanceMode}
              onChange={handleChange}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        <div>
          <label htmlFor="supportEmail" className="block mb-2 font-medium text-gray-700">Support Email Address</label>
          <input
            id="supportEmail"
            name="supportEmail"
            type="email"
            value={settings.supportEmail}
            onChange={handleChange}
            placeholder="support@example.com"
            className="w-full max-w-md rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="pt-5">
          <button
            onClick={handleSaveSettings}
            disabled={isSaving}
            className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow hover:bg-blue-700 disabled:opacity-70 transition-colors"
          >
            {isSaving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <main className="flex-1 p-6 sm:p-8 max-w-4xl mx-auto">
        <header className="mb-8 flex items-center gap-3">
          <Cog6ToothIcon className="h-8 w-8 text-gray-700" />
          <h1 className="text-3xl font-bold text-gray-800">Admin Settings</h1>
        </header>
        {renderContent()}
      </main>
    </div>
  );
}