// src/App.jsx
import AppRoutes from "./routes/AppRoutes";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import SignupSigninModal from "./components/SignupSigninModal";
import { Toaster } from 'react-hot-toast'; // Import Toaster

function App() {
  // Navbar height is approx 4rem (64px) on mobile, 5rem (80px) on desktop.
  // Toasts should appear just below this.
  // Example: 80px (desktop navbar height) + 8px gutter = 88px
  // Or using rem: navbar is sticky top-0, so toasts appear from top of viewport + offset
  const toastTopOffset = '5.5rem'; // Adjust this value (e.g., '88px', '6rem') as needed

  return (
    <>
      <Toaster 
        position="top-right" 
        reverseOrder={false}
        gutter={8}
        containerStyle={{
          top: toastTopOffset, // Apply top offset to push toasts below where the navbar sits
          right: '1rem',      // Standard right offset
          zIndex: 1100,       // Ensure toasts are above everything, including potentially high z-index navbar
        }}
        toastOptions={{
          duration: 5000,
          style: {
            background: '#363636',
            color: '#fff',
            // zIndex is better on containerStyle if possible, but can be here too
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#10B981',
              secondary: '#FFFFFF',
            },
            style: {
              background: '#10B981',
              color: '#FFFFFF',
            }
          },
          error: {
            duration: 5000,
            iconTheme: {
              primary: '#EF4444',
              secondary: '#FFFFFF',
            },
            style: {
              background: '#EF4444',
              color: '#FFFFFF',
            }
          },
        }}
      />

      <Navbar /> {/* This is sticky, so it will overlay content */}
      <SignupSigninModal />
      
      {/* The div wrapping AppRoutes no longer has top padding. */}
      {/* Page content will now start from the top of the viewport. */}
      {/* The sticky Navbar will overlay the top part of your pages. */}
      <div> 
        <AppRoutes />
      </div>
      
      <Footer />
    </>
  );
}

export default App;
