import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { UserCircleIcon, EnvelopeIcon } from '@heroicons/react/24/outline';

import Sidebar from '../../components/Sidebar';
import { useAuth } from '../../context/AuthContext';

// A reusable component to display user information rows
const InfoDisplayRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-center py-3 border-b border-gray-100 last:border-b-0">
    <Icon className="h-6 w-6 text-gray-400 mr-4 flex-shrink-0" />
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-md font-medium text-gray-800">{value}</p>
    </div>
  </div>
);

export default function BuyerProfilePage() {
  const { currentUser, updateUserProfile, isLoading: isAuthLoading } = useAuth();
  
  const [formData, setFormData] = useState({ firstName: '', lastName: '' });
  const [formErrors, setFormErrors] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Effect to populate the form when user data is available
  useEffect(() => {
    if (currentUser) {
      setFormData({
        firstName: currentUser.firstName || '',
        lastName: currentUser.lastName || '',
      });
    }
  }, [currentUser]);

  // Client-side validation logic
  const validate = useCallback(() => {
    const errors = {};
    if (!formData.firstName.trim() || formData.firstName.trim().length < 2) {
      errors.firstName = 'First name must be at least 2 characters.';
    }
    if (!formData.lastName.trim() || formData.lastName.trim().length < 2) {
      errors.lastName = 'Last name must be at least 2 characters.';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData]);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    // Clear error for a field when the user starts typing in it
    if (formErrors[e.target.name]) {
      setFormErrors(prev => ({ ...prev, [e.target.name]: null }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      toast.error('Please correct the errors in the form.');
      return;
    }
    
    // Prevent API call if no data has changed
    if (formData.firstName.trim() === currentUser.firstName && formData.lastName.trim() === currentUser.lastName) {
      toast.success('No changes to save.');
      setIsEditing(false);
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading("Updating your profile...");
    
    const result = await updateUserProfile({
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
    });

    if (result.success) {
      toast.success('Profile updated successfully!', { id: toastId });
      setIsEditing(false); // Switch back to view mode on success
    } else {
      toast.error(result.error || 'Failed to update profile.', { id: toastId });
    }
    setIsSubmitting(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Reset form data to the original state from the context
    if (currentUser) {
        setFormData({
            firstName: currentUser.firstName || '',
            lastName: currentUser.lastName || '',
        });
    }
    setFormErrors({});
  };

  if (isAuthLoading || !currentUser) {
    return (
      <div className="flex min-h-screen bg-gray-100">
        <Sidebar />
        <main className="flex-1 p-8 flex justify-center items-center">
          <p className="text-lg animate-pulse">Loading Profile...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <main className="flex-1 p-6 sm:p-8">
        <div className="max-w-2xl mx-auto">
          <header className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
              <UserCircleIcon className="h-8 w-8 text-blue-600" /> My Profile
            </h1>
            <p className="text-sm text-gray-500 mt-1">View and manage your account details.</p>
          </header>
          
          <div className="bg-white p-8 rounded-xl shadow-lg">
            {!isEditing ? (
              // --- VIEW MODE ---
              <div className="space-y-4">
                <InfoDisplayRow icon={UserCircleIcon} label="Full Name" value={`${currentUser.firstName} ${currentUser.lastName}`} />
                <InfoDisplayRow icon={EnvelopeIcon} label="Email Address" value={currentUser.email} />
                <div className="pt-6 border-t mt-6">
                  <button onClick={() => setIsEditing(true)} className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 text-white rounded-md hover:bg-blue-700">Edit Profile</button>
                </div>
              </div>
            ) : (
              // --- EDIT MODE ---
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">First Name</label>
                  <input id="firstName" name="firstName" type="text" value={formData.firstName} onChange={handleChange} className={`mt-1 w-full px-4 py-2 border rounded-md ${formErrors.firstName ? 'border-red-500' : 'border-gray-300'}`} />
                  {formErrors.firstName && <p className="text-red-600 text-xs mt-1">{formErrors.firstName}</p>}
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">Last Name</label>
                  <input id="lastName" name="lastName" type="text" value={formData.lastName} onChange={handleChange} className={`mt-1 w-full px-4 py-2 border rounded-md ${formErrors.lastName ? 'border-red-500' : 'border-gray-300'}`} />
                  {formErrors.lastName && <p className="text-red-600 text-xs mt-1">{formErrors.lastName}</p>}
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email Address</label>
                  <input id="email" type="email" value={currentUser.email} readOnly className="mt-1 w-full px-4 py-2 border-gray-300 rounded-md bg-gray-100 text-gray-500 cursor-not-allowed" />
                </div>
                <div className="flex justify-end gap-4 pt-4 border-t">
                  <button type="button" onClick={handleCancel} disabled={isSubmitting} className="px-4 py-2 rounded-md border border-gray-300 hover:bg-gray-100">Cancel</button>
                  <button type="submit" disabled={isSubmitting} className="px-6 py-2 rounded-md bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-70">{isSubmitting ? 'Saving...' : 'Save Changes'}</button>
                </div>
              </form>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}