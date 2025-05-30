import React from "react";
import { NavLink, useLocation } from "react-router-dom"; // Removed useNavigate as it's not used
import { UserCircleIcon, ArrowLeftStartOnRectangleIcon } from "@heroicons/react/24/solid"; 
// AuthContext is responsible for providing authentication state, user details, and signout functionality.
import { useAuthContext } from '../context/AuthContext'; 
import toast from "react-hot-toast";

// This Sidebar component is used within authenticated user dashboards (e.g., Buyer or Seller).
// Props:
// - links: An array of navigation link objects { path, label, icon }.
// - userRole: The role of the current user (e.g., "Buyer", "Seller").
//             This should be derived from AuthContext's currentUser.role by the parent component.
// - userName: The display name of the current user.
//             This should be constructed from AuthContext's currentUser.firstname and currentUser.lastname
//             by the parent component.

export default function Sidebar({ links, userRole, userName }) {
  const location = useLocation(); 
  // isLoading: authIsLoading from AuthContext indicates if an auth operation (like signout) is in progress.
  // signout: function from AuthContext that handles the backend API call to /logout.
  const { signout, isLoading: authIsLoading } = useAuthContext(); 

  const handleSignOut = async () => {
    try {
      // The signout function from AuthContext will make the API call to the backend
      // to invalidate the session/token and then update the global auth state.
      await signout(); 
      // Navigation and success/error toasts are typically handled within the AuthContext's signout method.
    } catch (error) {
      // This catch block can handle errors if signout() itself throws an error that isn't caught internally.
      console.error("Sidebar: Error during signout:", error);
      toast.error("Failed to sign out. Please try again.");
    }
  };

  // Construct the display name for the user.
  // If userName prop is not provided, attempt to use AuthContext's currentUser directly,
  // though the primary expectation is for the parent to pass a formatted userName.
  const displayName = userName || "User"; 
  const displayRole = userRole || "Account";

  return (
    <aside className="h-screen bg-white shadow-2xl flex flex-col sticky top-0 left-0 z-40 print:hidden w-20 md:w-20 lg:w-60">
      {/* User Info Area */}
      <div className="p-2 lg:p-5 border-b border-gray-200">
        <div className="flex flex-col items-center lg:flex-row lg:items-center lg:gap-3">
          <UserCircleIcon className="h-10 w-10 text-gray-400" />

          <div className="mt-1 lg:mt-0 text-center lg:text-left">
            <p
              className="hidden lg:block text-sm font-semibold text-gray-800 capitalize truncate"
              title={displayName}
            >
              {displayName}
            </p>
            <p className="hidden lg:block text-xs text-gray-500 capitalize">
              {displayRole ? `${displayRole} Account` : "Account"}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-grow p-2 lg:p-4 space-y-1.5 overflow-y-auto">
        {links && links.map((link) => (
          <NavLink
            key={link.path}
            to={link.path}
            // 'end' prop ensures exact match for parent routes like '/dashboard'
            // and not for sub-routes like '/dashboard/settings'
            end={link.path.endsWith('dashboard') || link.path === "/"} 
            className={({ isActive }) =>
              `flex flex-col lg:flex-row items-center lg:items-start gap-1 lg:gap-3.5 px-3 lg:px-4 py-2.5 rounded-lg text-xs lg:text-sm font-medium transition-all duration-200 ease-in-out group 
              ${isActive
                ? 'bg-blue-600 text-white shadow-lg transform scale-[1.02]'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`
            }
          >
            {link.icon && React.createElement(link.icon, {
              className: `h-5 w-5 transition-colors group-hover:text-blue-500 ${
                // Check isActive for icon color as well
                location.pathname === link.path || (link.path !== "/" && location.pathname.startsWith(link.path) && !link.end)
                  ? 'text-white' 
                  : 'text-gray-400'
              }`
            })}
            <span className="hidden lg:inline">{link.label}</span>
            <span className="lg:hidden text-[10px] text-center block">{link.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Sign out */}
      <div className="p-2 lg:p-4 mt-auto border-t border-gray-200">
        <button
          onClick={handleSignOut}
          disabled={authIsLoading} // Disable button if an auth operation is in progress
          className="w-full flex flex-col lg:flex-row items-center gap-1 lg:gap-3 px-3 lg:px-4 py-2.5 rounded-lg text-xs lg:text-sm text-red-600 bg-red-50 hover:bg-red-100 hover:text-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ArrowLeftStartOnRectangleIcon className="h-5 w-5 text-red-500" />
          <span className="hidden lg:inline">Sign Out</span>
          <span className="lg:hidden text-[10px]">Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
