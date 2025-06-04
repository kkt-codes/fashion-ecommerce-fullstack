import React, { useState, useEffect } from "react";
import { EyeIcon, EyeSlashIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useSignupSigninModal } from "../hooks/useSignupSigninModal.jsx";
import { useAuthContext } from "../context/AuthContext";
import toast from 'react-hot-toast';

export default function SignupSigninModal() {
  const { isOpen, closeModal, activeTab, switchToTab } = useSignupSigninModal();
  const { signin, signup, isLoading: authIsLoading } = useAuthContext();

  const initialFormState = {
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "BUYER", // Default role for signup, ensure matches backend expectations (e.g., uppercase)
  };
  const [formData, setFormData] = useState(initialFormState);
  const [showMainPassword, setShowMainPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
        setFormData(initialFormState); // Reset form when modal becomes visible
        setFormErrors({});
        setShowMainPassword(false);
        setShowConfirmPassword(false);
    }
  }, [isOpen, activeTab]); // Reset also if tab changes while open


  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (formErrors[name]) {
        setFormErrors(prev => ({...prev, [name]: null}));
    }
  };
  
  const handleBlur = (e) => {
    const { name, value } = e.target;
    let error = "";
    // Basic client-side validation on blur
    if (name === "email") {
        if (!value.trim()) error = "Email is required.";
        else if (!/\S+@\S+\.\S+/.test(value)) error = "Email address is invalid.";
    }
    if (name === "password" && activeTab === 'signup') { // Only validate length for signup password on blur initially
        if (!value) error = "Password is required.";
        else if (value.length < 8) error = "Password must be at least 8 characters."; // Match backend DTO
    } else if (name === "password" && activeTab === 'signin' && !value) {
        error = "Password is required.";
    }
    if (activeTab === 'signup') {
        if (name === "firstName" && !value.trim()) error = "First name is required.";
        if (name === "lastName" && !value.trim()) error = "Last name is required.";
        if (name === "confirmPassword" && formData.password && value !== formData.password) error = "Passwords do not match.";
    }

    if (error) {
        setFormErrors(prev => ({...prev, [name]: error}));
    } else if (formErrors[name]) {
        setFormErrors(prev => ({...prev, [name]: null}));
    }
  };

  const toggleMainPasswordVisibility = () => setShowMainPassword((prev) => !prev);
  const toggleConfirmPasswordVisibility = () => setShowConfirmPassword((prev) => !prev);

  const validateSignup = () => {
    const errors = {};
    if (!formData.firstName.trim()) errors.firstName = "First name is required.";
    else if(formData.firstName.trim().length < 2) errors.firstName = "First name is too short.";
    
    if (!formData.lastName.trim()) errors.lastName = "Last name is required.";
    else if(formData.lastName.trim().length < 2) errors.lastName = "Last name is too short.";

    if (!formData.email.trim()) errors.email = "Email is required.";
    else if (!/\S+@\S+\.\S+/.test(formData.email)) errors.email = "Email address is invalid.";
    
    if (!formData.password) errors.password = "Password is required.";
    else if (formData.password.length < 8) errors.password = "Password must be at least 8 characters."; // Match backend DTO
    
    if (!formData.confirmPassword) errors.confirmPassword = "Please confirm your password.";
    else if (formData.password !== formData.confirmPassword) errors.confirmPassword = "Passwords do not match.";
    
    if (!formData.role) errors.role = "Please select a role."; // Should not happen with select default

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  const validateSignin = () => {
    const errors = {};
    if (!formData.email.trim()) errors.email = "Email is required.";
    else if (!/\S+@\S+\.\S+/.test(formData.email)) errors.email = "Email address is invalid.";
    if (!formData.password) errors.password = "Password is required.";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setFormErrors({}); 
    if (!validateSignup()) {
        toast.error("Please correct the errors in the form.");
        return;
    }

    // Ensure role is uppercase as expected by backend
    const payload = { ...formData, role: formData.role.toUpperCase() };
    delete payload.confirmPassword; // Don't send confirmPassword to backend

    const result = await signup(payload); // signup from AuthContext

    if (result.success && result.user) {
      toast.success(result.message || `Account for ${result.user.firstName} created! Please sign in.`);
      // switchToTab("signin"); // Optionally switch to signin tab
      // setFormData(prev => ({...initialFormState, email: prev.email})); // Keep email for convenience
      closeModal(); // Close modal on successful signup, user can then sign in
    } else {
      toast.error(result.error || "Signup failed. Please try again.");
      if (result.error && result.error.toLowerCase().includes("email")) {
        setFormErrors(prev => ({...prev, email: result.error}));
      } else {
        setFormErrors(prev => ({...prev, general: result.error || "An unexpected error occurred."}));
      }
    }
  };

  const handleSigninSubmit = async (e) => {
    e.preventDefault();
    setFormErrors({}); 
    if (!validateSignin()) {
        toast.error("Please correct the errors in the form.");
        return;
    }
    const { email, password } = formData; 
    
    // roleAttempt is not used by our backend login, it determines role from credentials
    const result = await signin(email, password, null); // signin from AuthContext

    if (result.success && result.user) {
      toast.success(`Welcome back, ${result.user.firstName}!`);
      closeModal();
    } else {
      toast.error(result.error || "Sign in failed. Please check your credentials.");
      setFormErrors({ general: result.error || "Invalid credentials. Please try again." });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] px-4 py-8 transition-opacity duration-300 ease-in-out">
      <div className="bg-white w-full max-w-md rounded-xl shadow-2xl p-6 sm:p-8 relative animate-fade-in max-h-[90vh] overflow-y-auto">
        <button 
          onClick={closeModal} 
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close modal"
        >
          <XMarkIcon className="h-7 w-7" />
        </button>

        <div className="flex justify-center gap-0 mb-6 sm:mb-8 border-b border-gray-200">
          <button
            onClick={() => switchToTab("signup")} 
            className={`py-3 px-2 text-base sm:text-lg font-semibold transition-all duration-200 ease-in-out w-1/2 rounded-t-md ${activeTab === "signup" ? "border-b-3 border-blue-600 text-blue-600 bg-blue-50" : "text-gray-500 hover:text-gray-800 border-b-3 border-transparent hover:bg-gray-100"}`}
          >
            Sign Up
          </button>
          <button
            onClick={() => switchToTab("signin")} 
            className={`py-3 px-2 text-base sm:text-lg font-semibold transition-all duration-200 ease-in-out w-1/2 rounded-t-md ${activeTab === "signin" ? "border-b-3 border-blue-600 text-blue-600 bg-blue-50" : "text-gray-500 hover:text-gray-800 border-b-3 border-transparent hover:bg-gray-100"}`}
          >
            Sign In
          </button>
        </div>
        {formErrors.general && <p className="text-sm text-red-600 text-center mb-4 -mt-2">{formErrors.general}</p>}
        
        <form onSubmit={activeTab === "signup" ? handleSignupSubmit : handleSigninSubmit} className="space-y-5">
          {activeTab === "signup" && (
            <>
              <FloatingInput label="First Name" name="firstName" value={formData.firstName} onChange={handleChange} onBlur={handleBlur} error={formErrors.firstName} autoComplete="given-name" />
              <FloatingInput label="Last Name" name="lastName" value={formData.lastName} onChange={handleChange} onBlur={handleBlur} error={formErrors.lastName} autoComplete="family-name"/>
            </>
          )}
          <FloatingInput label="Email Address" name="email" type="email" value={formData.email} onChange={handleChange} onBlur={handleBlur} error={formErrors.email} autoComplete="email"/>
          <FloatingPasswordInput
            label="Password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            onBlur={handleBlur}
            show={showMainPassword}
            toggleShow={toggleMainPasswordVisibility}
            error={formErrors.password}
            autoComplete={activeTab === "signup" ? "new-password" : "current-password"}
          />
          {activeTab === "signup" && (
            <>
              <FloatingPasswordInput
                label="Confirm Password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                onBlur={handleBlur}
                show={showConfirmPassword}
                toggleShow={toggleConfirmPasswordVisibility}
                error={formErrors.confirmPassword}
                autoComplete="new-password"
              />
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1.5">Sign up as:</label>
                <select
                  id="role" name="role" value={formData.role} onChange={handleChange}
                  className="w-full mt-1 border border-gray-300 px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm bg-white"
                >
                  <option value="BUYER">Buyer</option>
                  <option value="SELLER">Seller</option>
                </select>
                 {formErrors.role && <p className="text-xs text-red-600 mt-1">{formErrors.role}</p>}
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={authIsLoading} 
            className="w-full flex items-center justify-center bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold text-base shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-70"
          >
            {authIsLoading ? (
                 <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                 </>
            ) : (
                activeTab === "signup" ? "Create Account" : "Sign In"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

// FloatingInput and FloatingPasswordInput components (assuming they are defined elsewhere or provided)
// For completeness, I'll include their definitions as you had them.
function FloatingInput({ label, name, type = "text", value, onChange, onBlur, error, autoComplete }) {
  return (
    <div className="relative mt-2"> 
      <input
        type={type} name={name} id={name} value={value} onChange={onChange} onBlur={onBlur}
        placeholder=" " 
        className={`peer w-full px-3 pt-4 pb-2 text-base text-gray-900 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent ${error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}`}
        required={type !== "checkbox" && type !== "radio"} // Basic required for text inputs
        autoComplete={autoComplete}
      />
      <label
        htmlFor={name}
        className={`absolute left-3 pointer-events-none text-base transition-all duration-200 ease-out ${error ? 'text-red-600' : 'text-gray-500 peer-focus:text-blue-600'}
          peer-placeholder-shown:top-3.5 
          peer-focus:-top-2.5 peer-focus:left-2 peer-focus:px-1 peer-focus:bg-white 
          peer-[:not(:placeholder-shown)]:-top-2.5 peer-[:not(:placeholder-shown)]:left-2 peer-[:not(:placeholder-shown)]:px-1 peer-[:not(:placeholder-shown)]:bg-white
        `}
      >
        {label}
      </label>
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}

function FloatingPasswordInput({ label, name, value, onChange, onBlur, show, toggleShow, error, autoComplete }) {
  return (
    <div className="relative mt-2"> 
      <input
        type={show ? "text" : "password"} name={name} id={name} value={value} onChange={onChange} onBlur={onBlur}
        placeholder=" " 
        className={`peer w-full px-3 pt-4 pb-2 text-base text-gray-900 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent ${error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}`}
        required
        autoComplete={autoComplete}
      />
      <label
        htmlFor={name}
        className={`
          absolute left-3 pointer-events-none 
          text-base transition-all duration-200 ease-out ${error ? 'text-red-600' : 'text-gray-500 peer-focus:text-blue-600'}
          peer-placeholder-shown:top-3.5 
          peer-focus:-top-2.5 peer-focus:left-2 peer-focus:px-1 peer-focus:bg-white
          peer-[:not(:placeholder-shown)]:-top-2.5 peer-[:not(:placeholder-shown)]:left-2 peer-[:not(:placeholder-shown)]:px-1 peer-[:not(:placeholder-shown)]:bg-white
        `}
      >
        {label}
      </label>
      <button 
        type="button" 
        onClick={toggleShow} 
        className="absolute right-3 top-1/2 -translate-y-1/2 transform text-gray-500 hover:text-gray-700 transition-colors" 
        aria-label={show ? "Hide password" : "Show password"}
      >
        {show ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
      </button>
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}
