import { createContext, useContext, useState, useCallback } from "react";

// 1. Create the Context
// This creates a context object that components can subscribe to.
const SignupSigninModalContext = createContext(null);

// 2. Create the Provider Component
// This component will wrap parts of our application (likely the whole app in App.js)
// and provide the modal's state and control functions to all children.
export const SignupSigninModalProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("signin"); // 'signin' or 'signup'

  // --- Control Functions ---
  // Using useCallback ensures these functions have a stable identity and
  // don't cause unnecessary re-renders in consumer components.

  const openModal = useCallback((initialTab = 'signin') => {
    setActiveTab(initialTab);
    setIsOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsOpen(false);
  }, []);
  
  const switchToTab = useCallback((tab) => {
      if (['signin', 'signup'].includes(tab)) {
          setActiveTab(tab);
      }
  }, []);

  // 3. Define the value to be passed to consumers
  // This object contains the state and the functions to modify it.
  const value = { 
    isModalOpen: isOpen, // Using a more descriptive name for clarity
    activeTab,
    openModal, 
    closeModal, 
    switchToTab 
  };

  return (
    <SignupSigninModalContext.Provider value={value}>
      {children}
    </SignupSigninModalContext.Provider>
  );
};

// 4. Create the Custom Hook
// This is the hook that components will use to access the context's value.
// It simplifies consumption and includes an error check for correctness.
export const useSignupSigninModal = () => {
  const context = useContext(SignupSigninModalContext);
  if (!context) {
    throw new Error('useSignupSigninModal must be used within a SignupSigninModalProvider');
  }
  return context;
};