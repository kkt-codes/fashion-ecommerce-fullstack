import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { UserCircleIcon } from '@heroicons/react/24/outline';

import { useAuth } from '../../context/AuthContext';
import Sidebar from '../../components/Sidebar';

export default function UserProfileEditPage() {
  const { currentUser, updateUserProfile, isLoading: isAuthLoading } = useAuth();
  
  const [formData, setFormData] = useState({ firstName: '', lastName: '', email: '' });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Effect to populate the form with the current user's data when it becomes available
  useEffect(() => {
    if (currentUser) {
      setFormData({
        firstName: currentUser.firstName || '',
        lastName: currentUser.lastName || '',
        email: currentUser.email || '',
      });
    }
  }, [currentUser]);

  const validate = useCallback(() => {
    const errors = {};
    if (!formData.firstName.trim() || formData.firstName.trim().length < 2) {
      errors.firstName = 'First name must be at least 2 characters.';
    }
    if (!formData.lastName.trim() || formData.lastName.trim().length < 2) {
      errors.lastName = 'Last name must be at least 2 characters.';
    }
    // Note: Email validation is not needed as the field is read-only.
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      toast.error('Please correct the errors in the form.');
      return;
    }

    // Only submit if there are actual changes
    if (formData.firstName.trim() === currentUser.firstName && formData.lastName.trim() === currentUser.lastName) {
        toast.success('No changes to save.');
        return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading("Updating profile...");
    
    try {
      const result = await updateUserProfile({
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
      });

      if (result.success) {
        toast.success('Profile updated successfully!', { id: toastId });
      } else {
        toast.error(result.error || 'Failed to update profile.', { id: toastId });
      }
    } catch (err) {
      toast.error('An unexpected error occurred.', { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleReset = () => {
      if (currentUser) {
          setFormData({
              firstName: currentUser.firstName || '',
              lastName: currentUser.lastName || '',
              email: currentUser.email || ''
          });
          setFormErrors({});
      }
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
        <div className="max-w-3xl mx-auto">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800">Edit Profile</h1>
                <p className="text-sm text-gray-500 mt-1">Update your personal information.</p>
            </header>
            <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-lg space-y-6">
              <div className="flex items-center space-x-4">
                <UserCircleIcon className="h-16 w-16 text-gray-300"/>
                <div>
                    <h2 className="text-xl font-semibold">{currentUser.firstName} {currentUser.lastName}</h2>
                    <p className="text-sm text-gray-500">{currentUser.role} Account</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">First Name</label>
                    <input id="firstName" name="firstName" type="text" value={formData.firstName} onChange={handleChange} className={`mt-1 w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 ${formErrors.firstName ? 'border-red-500 ring-red-500' : 'border-gray-300 focus:ring-blue-500'}`} disabled={isSubmitting} />
                    {formErrors.firstName && <p className="text-red-600 text-xs mt-1">{formErrors.firstName}</p>}
                </div>
                <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">Last Name</label>
                    <input id="lastName" name="lastName" type="text" value={formData.lastName} onChange={handleChange} className={`mt-1 w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 ${formErrors.lastName ? 'border-red-500 ring-red-500' : 'border-gray-300 focus:ring-blue-500'}`} disabled={isSubmitting} />
                    {formErrors.lastName && <p className="text-red-600 text-xs mt-1">{formErrors.lastName}</p>}
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email Address</label>
                <input id="email" type="email" value={formData.email} readOnly className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-500 cursor-not-allowed" />
                <p className="text-xs text-gray-500 mt-1">Email address cannot be changed.</p>
              </div>

              <div className="flex justify-end items-center gap-4 pt-4 border-t border-gray-200">
                <button type="button" onClick={handleReset} disabled={isSubmitting} className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100">Reset</button>
                <button type="submit" disabled={isSubmitting} className="px-6 py-2 rounded-md bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-70">
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
        </div>
      </main>
    </div>
  );
}