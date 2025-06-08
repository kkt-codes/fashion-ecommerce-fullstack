import React, { useState, useEffect, useCallback } from "react";
import { EyeIcon, EyeSlashIcon, XMarkIcon } from "@heroicons/react/24/outline";
import toast from 'react-hot-toast';

import { useSignupSigninModal } from "../hooks/useSignupSigninModal";
import { useAuth } from "../context/AuthContext";

// Reusable Floating-Label Input Component
const FloatingInput = ({ label, name, type = "text", value, onChange, error, ...props }) => {
  return (
    <div className="relative">
      <input
        type={type}
        name={name}
        id={name}
        value={value}
        onChange={onChange}
        placeholder=" "
        className={`peer w-full px-3 pt-4 pb-2 text-base text-gray-900 border rounded-lg focus:outline-none focus:ring-2 ${error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}`}
        required
        {...props}
      />
      <label
        htmlFor={name}
        className={`absolute left-3 pointer-events-none text-base transition-all duration-200 ease-out 
          ${error ? 'text-red-600' : 'text-gray-500 peer-focus:text-blue-600'}
          peer-placeholder-shown:top-3.5 
          peer-focus:-top-2.5 peer-focus:text-sm peer-focus:left-2 peer-focus:px-1 peer-focus:bg-white 
          peer-[:not(:placeholder-shown)]:-top-2.5 peer-[:not(:placeholder-shown)]:left-2 peer-[:not(:placeholder-shown)]:px-1 peer-[:not(:placeholder-shown)]:bg-white peer-[:not(:placeholder-shown)]:text-sm`}
      >
        {label}
      </label>
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
};

// Reusable Floating-Label Password Input Component
const FloatingPasswordInput = ({ label, name, value, onChange, error, ...props }) => {
    const [show, setShow] = useState(false);
    return (
        <div className="relative">
            <FloatingInput
                label={label}
                name={name}
                type={show ? "text" : "password"}
                value={value}
                onChange={onChange}
                error={error}
                {...props}
            />
            <button
                type="button"
                onClick={() => setShow(!show)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                aria-label={show ? "Hide password" : "Show password"}
            >
                {show ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
            </button>
        </div>
    );
};

// Main Modal Component
export default function SignupSigninModal() {
  const { isModalOpen, closeModal, activeTab, switchToTab } = useSignupSigninModal();
  const { login, register, isLoading: isAuthLoading } = useAuth();

  const initialFormState = { firstName: "", lastName: "", email: "", password: "", confirmPassword: "", role: "BUYER" };
  const [formData, setFormData] = useState(initialFormState);
  const [formErrors, setFormErrors] = useState({});

  // Reset form state when the modal is opened or the tab is switched
  useEffect(() => {
    if (isModalOpen) {
      setFormData(initialFormState);
      setFormErrors({});
    }
  }, [isModalOpen, activeTab]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validate = useCallback(() => {
    const errors = {};
    if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email)) {
        errors.email = "A valid email is required.";
    }
    if (!formData.password) errors.password = "Password is required.";

    if (activeTab === 'signup') {
        if (!formData.firstName.trim()) errors.firstName = "First name is required.";
        if (!formData.lastName.trim()) errors.lastName = "Last name is required.";
        if (formData.password.length < 8) errors.password = "Password must be at least 8 characters.";
        if (formData.password !== formData.confirmPassword) errors.confirmPassword = "Passwords do not match.";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData, activeTab]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      toast.error("Please correct the errors in the form.");
      return;
    }

    let result;
    if (activeTab === 'signin') {
        result = await login({ email: formData.email, password: formData.password });
    } else {
        const { confirmPassword, ...signupPayload } = formData;
        result = await register(signupPayload);
    }

    if (result.success) {
      toast.success(result.message || (activeTab === 'signin' ? `Welcome back, ${result.user.firstName}!` : "Account created successfully!"));
      closeModal();
    } else {
      toast.error(result.error || "An unexpected error occurred.");
    }
  };

  if (!isModalOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] px-4">
      <div className="bg-white w-full max-w-md rounded-xl shadow-2xl p-8 relative animate-fade-in max-h-[90vh] overflow-y-auto">
        <button onClick={closeModal} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><XMarkIcon className="h-7 w-7" /></button>

        <div className="flex justify-center border-b border-gray-200 mb-8">
            <button onClick={() => switchToTab("signin")} className={`py-3 px-4 text-lg font-semibold w-1/2 rounded-t-md ${activeTab === "signin" ? "border-b-3 border-blue-600 text-blue-600" : "text-gray-500 hover:text-gray-800 border-b-3 border-transparent"}`}>Sign In</button>
            <button onClick={() => switchToTab("signup")} className={`py-3 px-4 text-lg font-semibold w-1/2 rounded-t-md ${activeTab === "signup" ? "border-b-3 border-blue-600 text-blue-600" : "text-gray-500 hover:text-gray-800 border-b-3 border-transparent"}`}>Sign Up</button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-5">
            {activeTab === 'signup' && (
                <>
                    <FloatingInput label="First Name" name="firstName" value={formData.firstName} onChange={handleChange} error={formErrors.firstName} autoComplete="given-name" />
                    <FloatingInput label="Last Name" name="lastName" value={formData.lastName} onChange={handleChange} error={formErrors.lastName} autoComplete="family-name"/>
                </>
            )}
            <FloatingInput label="Email Address" name="email" type="email" value={formData.email} onChange={handleChange} error={formErrors.email} autoComplete="email"/>
            <FloatingPasswordInput label="Password" name="password" value={formData.password} onChange={handleChange} error={formErrors.password} autoComplete={activeTab === 'signup' ? 'new-password' : 'current-password'} />
            
            {activeTab === 'signup' && (
                <>
                    <FloatingPasswordInput label="Confirm Password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} error={formErrors.confirmPassword} autoComplete="new-password" />
                    <div>
                        <label htmlFor="role" className="block text-sm font-medium text-gray-700">I am a:</label>
                        <select id="role" name="role" value={formData.role} onChange={handleChange} className="w-full mt-1 border-gray-300 rounded-lg text-sm">
                            <option value="BUYER">Buyer (I want to shop)</option>
                            <option value="SELLER">Seller (I want to sell)</option>
                        </select>
                    </div>
                </>
            )}
            <button type="submit" disabled={isAuthLoading} className="w-full flex justify-center bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-semibold text-base shadow-md disabled:opacity-70">
                {isAuthLoading ? 'Processing...' : (activeTab === 'signup' ? 'Create Account' : 'Sign In')}
            </button>
        </form>
      </div>
    </div>
  );
}