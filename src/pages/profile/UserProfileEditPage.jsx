import React, { useState, useEffect } from 'react';
import { useAuthContext } from '../../context/AuthContext';
import Sidebar from '../../components/Sidebar';
import toast from 'react-hot-toast';
import { UserCircleIcon, EnvelopeIcon } from '@heroicons/react/24/outline';

export default function UserProfileEditPage() {
  const { currentUser, updateCurrentUserData, isLoading: isAuthLoading } = useAuthContext();
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(true); // Start on edit mode directly

  useEffect(() => {
    if (currentUser) {
      setFormData({
        firstName: currentUser.firstName || '',
        lastName: currentUser.lastName || '',
        email: currentUser.email || '',
      });
    }
  }, [currentUser]);

  const validate = () => {
    const errors = {};
    if (!formData.firstName.trim()) errors.firstName = 'First name is required.';
    else if (formData.firstName.trim().length < 2) errors.firstName = 'First name must be at least 2 characters.';
    if (!formData.lastName.trim()) errors.lastName = 'Last name is required.';
    else if (formData.lastName.trim().length < 2) errors.lastName = 'Last name must be at least 2 characters.';
    // Email is not editable or you can add validation here if editable.

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

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
    setIsSubmitting(true);
    try {
      const result = await updateCurrentUserData({
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        // If email editable, include email here
      });
      if (result.success) {
        toast.success('Profile updated successfully!');
        setIsEditing(false);
      } else {
        toast.error(result.error || 'Failed to update profile.');
      }
    } catch (err) {
      toast.error('Unexpected error updating profile.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isAuthLoading) {
    return (
      <div className="flex min-h-screen bg-gray-100">
        <Sidebar />
        <main className="flex-1 p-6 flex justify-center items-center">
          <p className="text-gray-500 animate-pulse text-lg">Loading Profile...</p>
        </main>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="flex min-h-screen bg-gray-100">
        <Sidebar />
        <main className="flex-1 p-6 flex flex-col justify-center items-center text-center">
          <UserCircleIcon className="h-16 w-16 text-gray-300 mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Profile Unavailable</h2>
          <p className="text-gray-600">Please sign in to view your profile.</p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <main className="flex-1 p-6 sm:p-8 max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">Edit Profile</h1>
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-md space-y-6">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
              First Name
            </label>
            <input
              id="firstName"
              name="firstName"
              type="text"
              value={formData.firstName}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${formErrors.firstName ? 'border-red-500' : 'border-gray-300'}`}
              disabled={isSubmitting}
            />
            {formErrors.firstName && <p className="text-red-600 text-xs mt-1">{formErrors.firstName}</p>}
          </div>

          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
              Last Name
            </label>
            <input
              id="lastName"
              name="lastName"
              type="text"
              value={formData.lastName}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${formErrors.lastName ? 'border-red-500' : 'border-gray-300'}`}
              disabled={isSubmitting}
            />
            {formErrors.lastName && <p className="text-red-600 text-xs mt-1">{formErrors.lastName}</p>}
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email (cannot be changed)
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              readOnly
              className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed"
            />
          </div>

          <div className="flex justify-end items-center gap-4">
            <button
              type="button"
              onClick={() => {
                setFormData({
                  firstName: currentUser.firstName || '',
                  lastName: currentUser.lastName || '',
                  email: currentUser.email || ''
                });
                setFormErrors({});
              }}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100 transition"
            >
              Reset
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 rounded-md bg-blue-600 text-white font-semibold hover:bg-blue-700 transition disabled:opacity-70"
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
