import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import { useAuthContext } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { UserCircleIcon, EnvelopeIcon } from '@heroicons/react/24/outline';

export default function BuyerProfile() {
  const { currentUser, isAuthenticated, userRole, isLoading: isAuthLoading, updateCurrentUserData } = useAuthContext();
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
  });
  const [isEditing, setIsEditing] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (currentUser) { // No need to check userRole === 'BUYER' here, BuyerProtectedRoute handles access
      setFormData({
        firstName: currentUser.firstName || '',
        lastName: currentUser.lastName || '',
        email: currentUser.email || '', 
      });
    }
  }, [currentUser]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validateProfileForm = () => {
    const errors = {};
    if (!formData.firstName.trim()) errors.firstName = "First name is required.";
    else if (formData.firstName.trim().length < 2) errors.firstName = "First name must be at least 2 characters.";
    
    if (!formData.lastName.trim()) errors.lastName = "Last name is required.";
    else if (formData.lastName.trim().length < 2) errors.lastName = "Last name must be at least 2 characters.";
    
    // Email is typically not editable by the user directly in a profile update form
    // If it were, you'd add validation:
    // if (!formData.email.trim()) errors.email = "Email is required.";
    // else if (!/\S+@\S+\.\S+/.test(formData.email)) errors.email = "Email is invalid.";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!validateProfileForm()) {
      toast.error("Please correct the form errors.");
      return;
    }
    if (!currentUser) { // Should be caught by isAuthenticated check too
        toast.error("User data not available. Please sign in again.");
        return;
    }

    setIsSubmitting(true);
    const detailsToUpdate = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      // Email is not sent for update as it's read-only in this form
      // If email change was allowed, and UserProfileUpdateDto on backend supports it:
      // email: formData.email, 
    };

    // updateCurrentUserData from AuthContext now handles the API call
    const result = await updateCurrentUserData(detailsToUpdate);

    if (result.success) {
      toast.success("Profile updated successfully!");
      setIsEditing(false); // Exit editing mode
    } else {
      toast.error(result.error || "Failed to update profile. Please try again.");
      // Optionally set formErrors if specific field errors are returned from backend
      // e.g., if (result.errorDetails) setFormErrors(result.errorDetails);
    }
    setIsSubmitting(false);
  };
  
  if (isAuthLoading) {
    return (
      <div className="flex min-h-screen bg-gray-100">
        <Sidebar /> {/* Sidebar will show its own loading state or minimal view */}
        <main className="flex-1 p-6 sm:p-8 flex justify-center items-center">
          <p className="text-gray-500 animate-pulse text-lg">Loading Profile...</p>
        </main>
      </div>
    );
  }

  if (!isAuthenticated || !currentUser) { // BuyerProtectedRoute should prevent this
    return (
      <div className="flex min-h-screen bg-gray-100">
        <Sidebar />
        <main className="flex-1 p-6 sm:p-8 flex flex-col justify-center items-center text-center">
          <UserCircleIcon className="h-16 w-16 text-gray-300 mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Profile Unavailable</h2>
          <p className="text-gray-600">Please sign in to view your profile.</p>
        </main>
      </div>
    );
  }
  // No need for userRole === 'BUYER' check here if BuyerProtectedRoute is used for this route

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar /> {/* Sidebar gets user info from AuthContext */}
      <main className="flex-1 p-6 sm:p-8">
        <header className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 flex items-center">
            <UserCircleIcon className="h-8 w-8 mr-3 text-blue-600" />
            My Profile
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            View and update your account details.
          </p>
        </header>

        <div className="bg-white p-6 sm:p-8 rounded-xl shadow-xl max-w-2xl mx-auto">
          {!isEditing ? (
            // View Mode
            <div className="space-y-5">
              <InfoDisplayRow icon={UserCircleIcon} label="Full Name" value={`${currentUser.firstName} ${currentUser.lastName}`} />
              <InfoDisplayRow icon={EnvelopeIcon} label="Email Address" value={currentUser.email} />
              {/* Add more fields to display if needed */}
              <button
                onClick={() => {
                    setIsEditing(true);
                    // Ensure form is populated with latest currentUser data when entering edit mode
                    setFormData({
                        firstName: currentUser.firstName || '',
                        lastName: currentUser.lastName || '',
                        email: currentUser.email || '',
                    });
                    setFormErrors({});
                }}
                className="mt-6 w-full sm:w-auto inline-flex justify-center items-center px-6 py-2.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Edit Profile
              </button>
            </div>
          ) : (
            // Edit Mode
            <form onSubmit={handleUpdateProfile} className="space-y-5">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                <input
                  type="text" name="firstName" id="firstName" value={formData.firstName}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 sm:text-sm ${formErrors.firstName ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
                />
                {formErrors.firstName && <p className="text-xs text-red-600 mt-1">{formErrors.firstName}</p>}
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                <input
                  type="text" name="lastName" id="lastName" value={formData.lastName}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 sm:text-sm ${formErrors.lastName ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
                />
                {formErrors.lastName && <p className="text-xs text-red-600 mt-1">{formErrors.lastName}</p>}
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email Address (Cannot be changed here)</label>
                <input
                  type="email" name="email" id="email" value={formData.email}
                  readOnly 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 text-gray-500 sm:text-sm cursor-not-allowed"
                />
                {/* If email change were allowed, add formErrors.email display */}
              </div>
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting || isAuthLoading}
                  className="w-full sm:w-auto inline-flex justify-center items-center px-6 py-2.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-70"
                >
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    if (currentUser) { // Reset form to current user data from context on cancel
                        setFormData({
                            firstName: currentUser.firstName || '',
                            lastName: currentUser.lastName || '',
                            email: currentUser.email || '',
                        });
                    }
                    setFormErrors({});
                  }}
                  className="w-full sm:w-auto inline-flex justify-center items-center px-6 py-2.5 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}

// Helper component for displaying info rows
const InfoDisplayRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-center">
    <Icon className="h-6 w-6 text-gray-400 mr-3 flex-shrink-0" />
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-md font-medium text-gray-800">{value}</p>
    </div>
  </div>
);
