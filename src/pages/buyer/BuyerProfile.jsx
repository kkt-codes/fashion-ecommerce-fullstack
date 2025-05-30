import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '../../components/Sidebar';
import { useAuthContext } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { 
  UserCircleIcon, 
  EnvelopeIcon, 
  // DevicePhoneMobileIcon, // Example if phone was a field
  ChartBarIcon, 
  ListBulletIcon, 
  ChatBubbleLeftEllipsisIcon, 
  HeartIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

const API_BASE_URL = 'http://localhost:8080/api'; // Not directly used here, AuthContext handles API calls

export default function BuyerProfile() {
  const { 
    currentUser, 
    isAuthenticated, 
    userRole, 
    isLoading: isAuthLoading, 
    updateCurrentUserData // This is the async function from AuthContext
  } = useAuthContext();
  
  const [formData, setFormData] = useState({
    firstname: '', // Changed to match backend UserDto field names
    lastname: '',  // Changed to match backend UserDto field names
    email: '',
  });
  const [isEditing, setIsEditing] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const buyerLinks = [
    { label: "Dashboard", path: "/buyer/dashboard", icon: ChartBarIcon },
    { label: "My Orders", path: "/buyer/orders", icon: ListBulletIcon },
    { label: "Messages", path: "/buyer/messages", icon: ChatBubbleLeftEllipsisIcon },
    { label: "My Profile", path: "/buyer/profile", icon: UserCircleIcon },
    { label: "My Favorites", path: "/buyer/favorites", icon: HeartIcon },
  ];

  // Pre-fill form when currentUser data is available
  useEffect(() => {
    if (currentUser) { // Removed userRole === 'Buyer' check as ProtectedRoute handles access
      setFormData({
        // Use field names consistent with UserDto (firstname, lastname)
        firstname: currentUser.firstname || '',
        lastname: currentUser.lastname || '',
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
    if (!formData.firstname.trim()) errors.firstname = "First name is required.";
    if (!formData.lastname.trim()) errors.lastname = "Last name is required.";
    // Email is not editable in this form.
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!validateProfileForm()) {
      toast.error("Please correct the form errors.");
      return;
    }
    if (!currentUser || !isAuthenticated) { // Simplified check
        toast.error("You must be signed in to update your profile.");
        return;
    }

    setIsSubmitting(true);
    // Prepare only the fields that are being updated and match backend DTO expectations
    // AuthContext's updateCurrentUserData expects { firstname, lastname } etc.
    // It will then map these to the UserSignUpDto for the backend if necessary.
    const detailsToUpdate = {
      firstname: formData.firstname,
      lastname: formData.lastname,
      // email: formData.email, // Not sending email as it's read-only
      // role: currentUser.role, // Role shouldn't be updated by user here
      // password: should be handled in a separate "Change Password" form
    };

    // updateCurrentUserData is async and comes from AuthContext
    const result = await updateCurrentUserData(detailsToUpdate); 
    // AuthContext's updateCurrentUserData handles the PUT /api/users/{id} call

    if (result.success) {
      toast.success("Profile updated successfully!");
      setIsEditing(false); // Exit editing mode
      // currentUser in AuthContext is updated, so UI should reflect changes.
    } else {
      toast.error(result.error || "Failed to update profile. Please try again.");
    }
    setIsSubmitting(false);
  };
  
  if (isAuthLoading) {
    return (
      <div className="flex min-h-screen bg-gray-100">
        <Sidebar links={buyerLinks} userRole="Buyer" userName={formData.firstname || "User"} />
        <main className="flex-1 p-6 sm:p-8 flex justify-center items-center">
          <p className="text-gray-500 animate-pulse text-lg">Loading Profile...</p>
        </main>
      </div>
    );
  }

  if (!isAuthenticated || userRole !== 'Buyer' || !currentUser) {
    return (
      <div className="flex min-h-screen bg-gray-100">
        <Sidebar links={buyerLinks} userRole="Buyer" />
        <main className="flex-1 p-6 sm:p-8 flex flex-col justify-center items-center text-center">
          <UserCircleIcon className="h-16 w-16 text-gray-300 mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Access Denied</h2>
          <p className="text-gray-600">Please sign in as a Buyer to view your profile.</p>
        </main>
      </div>
    );
  }
  
  // Use currentUser for display and formData for editing
  const displayUser = isEditing ? formData : {
      firstname: currentUser.firstname || '',
      lastname: currentUser.lastname || '',
      email: currentUser.email || ''
  };


  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar links={buyerLinks} userRole="Buyer" userName={currentUser.firstname} />
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
            <div className="space-y-5">
              <InfoDisplayRow icon={UserCircleIcon} label="Full Name" value={`${currentUser.firstname || ''} ${currentUser.lastname || ''}`} />
              <InfoDisplayRow icon={EnvelopeIcon} label="Email Address" value={currentUser.email || ''} />
              {/* Add more fields here if needed */}
              <button
                onClick={() => {
                    // Ensure form is populated with latest currentUser details when starting to edit
                    setFormData({
                        firstname: currentUser.firstname || '',
                        lastname: currentUser.lastname || '',
                        email: currentUser.email || '',
                    });
                    setIsEditing(true);
                }}
                className="mt-6 w-full sm:w-auto inline-flex justify-center items-center px-6 py-2.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Edit Profile
              </button>
            </div>
          ) : (
            <form onSubmit={handleUpdateProfile} className="space-y-5">
              <FormField
                label="First Name" name="firstname" value={formData.firstname}
                onChange={handleChange} error={formErrors.firstname}
              />
              <FormField
                label="Last Name" name="lastname" value={formData.lastname}
                onChange={handleChange} error={formErrors.lastname}
              />
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email Address (Cannot be changed)</label>
                <input
                  type="email" name="email" id="email" value={formData.email}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 text-gray-500 sm:text-sm cursor-not-allowed"
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto inline-flex justify-center items-center px-6 py-2.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-70"
                >
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    // Reset form to original currentUser data from context
                    if (currentUser) {
                        setFormData({
                            firstname: currentUser.firstname || '',
                            lastname: currentUser.lastname || '',
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
    <Icon className="h-6 w-6 text-gray-400 mr-4 flex-shrink-0" />
    <div className="flex-grow">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-md font-medium text-gray-800 break-words">{value || "Not provided"}</p>
    </div>
  </div>
);

// Helper component for form fields
const FormField = ({ label, name, value, onChange, error, type = "text", readOnly = false }) => (
  <div>
    <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <input
      type={type} name={name} id={name} value={value}
      onChange={onChange} readOnly={readOnly}
      className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 sm:text-sm 
                  ${readOnly ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}
                  ${error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
    />
    {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
  </div>
);
