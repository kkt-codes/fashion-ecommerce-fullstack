import { createContext, useContext, useState } from "react";

// Create the context
const SignupSigninModalContext = createContext();

// Provider component that wraps your app
export const SignupSigninModalProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("signup"); // 'signup' or 'signin'

  // Open modal (default tab stays the same)
  const openModal = () => setIsOpen(true);

  // Close modal
  const closeModal = () => setIsOpen(false);

  // Change active tab
  const switchToTab = (tab) => setActiveTab(tab); // 'signup' or 'signin'

  return (
    <SignupSigninModalContext.Provider
      value={{ isOpen, openModal, closeModal, activeTab, switchToTab }}
    >
      {children}
    </SignupSigninModalContext.Provider>
  );
};

// Hook for components to use the modal control
export const useSignupSigninModal = () => useContext(SignupSigninModalContext);
