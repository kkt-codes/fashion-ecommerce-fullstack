import AppRoutes from "./routes/AppRoutes";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import SignupSigninModal from "./components/SignupSigninModal";
import { Toaster } from 'react-hot-toast';

function App() {
  const toastTopOffset = '5.5rem';

  return (
    <>
      <Toaster 
        position="top-right" 
        reverseOrder={false}
        gutter={8}
        containerStyle={{
          top: toastTopOffset,
          right: '1rem',
          zIndex: 1100,
        }}
        toastOptions={{
          duration: 5000,
          style: {
            background: '#363636',
            color: '#fff',
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

      <Navbar />
      <SignupSigninModal />
      
      {/* --- FIX: The padding-top class has been removed from this div --- */}
      <div> 
        <AppRoutes />
      </div>
      
      <Footer />
    </>
  );
}

export default App;