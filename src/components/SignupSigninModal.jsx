import React, { useState, useEffect } from "react";
import { EyeIcon, EyeSlashIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useSignupSigninModal } from "../hooks/useSignupSigninModal.jsx";
import { useAuthContext } from "../context/AuthContext"; // This context will handle the actual API calls
import toast from 'react-hot-toast';

// Mock data imports (buyers.json, sellers.json) should have been removed,
// as authentication will now be handled by the backend.
// The backend UserController exposes /api/users/signup and /api/users/signin

export default function SignupSigninModal() {
  const { isOpen, closeModal, activeTab, switchToTab } = useSignupSigninModal();
  // useAuthContext will provide functions that make API calls to the backend.
  // isLoading will reflect the state of these API calls.
  const { signin, signup, isLoading: authIsLoading } = useAuthContext(); 

  const initialFormState = {
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "Buyer", // Default role for signup, matches backend UserSignUpDto
  };
  const [formData, setFormData] = useState(initialFormState);

  const [showMainPassword, setShowMainPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
        resetForm();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, isOpen]);

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
    // Client-side validation remains useful for immediate feedback
    if (activeTab === 'signup') {
        if (name === "firstName" && !value.trim()) error = "First name is required.";
        if (name === "lastName" && !value.trim()) error = "Last name is required.";
        if (name === "email") {
            if (!value.trim()) error = "Email is required.";
            else if (!/\S+@\S+\.\S+/.test(value)) error = "Email address is invalid.";
        }
        if (name === "password") {
            if (!value) error = "Password is required.";
            else if (value.length < 6) error = "Password must be at least 6 characters."; // Align with backend rules if different
        }
        if (name === "confirmPassword" && value !== formData.password) error = "Passwords do not match.";
    } else { 
        if (name === "email" && !value.trim()) error = "Email is required.";
        if (name === "password" && !value) error = "Password is required.";
    }
    if (error) {
        setFormErrors(prev => ({...prev, [name]: error}));
    } else if (formErrors[name]) {
        setFormErrors(prev => ({...prev, [name]: null}));
    }
  };

  const toggleMainPasswordVisibility = () => setShowMainPassword((prev) => !prev);
  const toggleConfirmPasswordVisibility = () => setShowConfirmPassword((prev) => !prev);

  const resetForm = () => {
    setFormData(initialFormState);
    setShowMainPassword(false);
    setShowConfirmPassword(false);
    setFormErrors({});
  };

  const validateSignup = () => {
    const errors = {};
    if (!formData.firstName.trim()) errors.firstName = "First name is required.";
    else if(formData.firstName.trim().length < 2) errors.firstName = "First name is too short."; // Example: align with backend validation
    if (!formData.lastName.trim()) errors.lastName = "Last name is required.";
    else if(formData.lastName.trim().length < 2) errors.lastName = "Last name is too short."; // Example: align with backend validation

    if (!formData.email.trim()) errors.email = "Email is required.";
    else if (!/\S+@\S+\.\S+/.test(formData.email)) errors.email = "Email address is invalid.";
    
    if (!formData.password) errors.password = "Password is required.";
    // Ensure this matches backend requirements (e.g., from SecurityConfig or DTO annotations)
    else if (formData.password.length < 6) errors.password = "Password must be at least 6 characters."; 
    
    if (!formData.confirmPassword) errors.confirmPassword = "Please confirm your password.";
    else if (formData.password !== formData.confirmPassword) errors.confirmPassword = "Passwords do not match.";
    
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

  const handleSignup = async (e) => {
    e.preventDefault();
    setFormErrors({});
    if (!validateSignup()) {
        toast.error("Please correct the errors highlighted in the form.");
        return;
    }

    // This data structure should match the backend's UserSignUpDto:
    // { firstName, lastName, email, password, role }
    const signupData = {
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      email: formData.email.trim(),
      password: formData.password, // Password sent as is; backend handles hashing
      role: formData.role, // 'Buyer' or 'Seller'
    };

    // The signup function (from AuthContext) will make a POST request to /api/users/signup
    // with signupData as the request body.
    // It should also handle storing the JWT token returned by the backend upon successful signup.
    const result = await signup(signupData);

    if (result.success && result.user) {
      toast.success(`Welcome, ${result.user.firstName}! Account created successfully.`);
      resetForm();
      closeModal();
    } else {
      // Error messages might come from the backend's GlobalExceptionHandler
      const errorMessage = result.error || "Signup failed. Please try again.";
      toast.error(errorMessage);
      if (errorMessage.toLowerCase().includes("email") || errorMessage.toLowerCase().includes("already exists")) {
        setFormErrors(prev => ({...prev, email: "This email is already registered."}));
      } else {
        setFormErrors(prev => ({...prev, general: errorMessage}));
      }
    }
  };

  const handleSignin = async (e) => {
    e.preventDefault();
    setFormErrors({});
    if (!validateSignin()) {
        toast.error("Please correct the errors highlighted in the form.");
        return;
    }
    
    // This data structure should match the backend's UserSignInDto:
    // { email, password }
    const signinData = {
        email: formData.email.trim(),
        password: formData.password,
    };
    
    // The signin function (from AuthContext) will make a POST request to /api/users/signin
    // with signinData as the request body.
    // It will handle the JWT token returned by the backend (e.g., storing it in localStorage)
    // and update the application's authentication state.
    const result = await signin(signinData.email, signinData.password); // Assuming signin context function takes email and password

    if (result.success && result.user) {
      toast.success(`Welcome back, ${result.user.firstName}!`);
      resetForm();
      closeModal();
    } else {
      // Error messages might come from the backend (e.g., "Invalid credentials")
      const errorMessage = result.error || "Sign in failed. Please check your credentials.";
      toast.error(errorMessage);
      setFormErrors({ general: errorMessage });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] px-4 py-8 transition-opacity duration-300 ease-in-out">
      <div className="bg-white w-full max-w-md rounded-xl shadow-2xl p-6 sm:p-8 relative animate-fade-in max-h-[90vh] overflow-y-auto">
        <button 
          onClick={() => { resetForm(); closeModal(); }} 
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close modal"
        >
          <XMarkIcon className="h-7 w-7" />
        </button>

        <div className="flex justify-center gap-0 mb-6 sm:mb-8 border-b border-gray-200">
          <button
            onClick={() => { switchToTab("signup"); }} 
            className={`py-3 px-2 text-base sm:text-lg font-semibold transition-all duration-200 ease-in-out w-1/2 rounded-t-md ${activeTab === "signup" ? "border-b-3 border-blue-600 text-blue-600 bg-blue-50" : "text-gray-500 hover:text-gray-800 border-b-3 border-transparent hover:bg-gray-100"}`}
          >
            Sign Up
          </button>
          <button
            onClick={() => { switchToTab("signin"); }} 
            className={`py-3 px-2 text-base sm:text-lg font-semibold transition-all duration-200 ease-in-out w-1/2 rounded-t-md ${activeTab === "signin" ? "border-b-3 border-blue-600 text-blue-600 bg-blue-50" : "text-gray-500 hover:text-gray-800 border-b-3 border-transparent hover:bg-gray-100"}`}
          >
            Sign In
          </button>
        </div>
        {formErrors.general && <p className="text-sm text-red-600 text-center mb-4 -mt-2">{formErrors.general}</p>}
        <form onSubmit={activeTab === "signup" ? handleSignup : handleSignin} className="space-y-5">
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
                <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1.5">I am signing up as a:</label>
                <select
                  id="role" name="role" value={formData.role} onChange={handleChange}
                  className="w-full mt-1 border border-gray-300 px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm bg-white"
                >
                  <option value="Buyer">Buyer</option>
                  <option value="Seller">Seller</option>
                </select>
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

// FloatingInput and FloatingPasswordInput components (unchanged from your original)
// These are well-styled and functional for the UI.

function FloatingInput({ label, name, type = "text", value, onChange, onBlur, error, autoComplete }) {
  return (
    <div className="relative mt-2"> 
      <input
        type={type} name={name} id={name} value={value} onChange={onChange} onBlur={onBlur}
        placeholder=" " 
        className={`peer w-full px-3 pt-4 pb-2 text-base text-gray-900 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent ${error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}`}
        required autoComplete={autoComplete}
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
        required autoComplete={autoComplete}
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
