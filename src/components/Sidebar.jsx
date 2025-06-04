// src/components/Sidebar.jsx
import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  UserCircleIcon,
  ArrowLeftStartOnRectangleIcon,
  HomeIcon,
  BuildingStorefrontIcon,
  ShoppingCartIcon,
  UserGroupIcon,
  Cog6ToothIcon,
  EnvelopeIcon,
  ArchiveBoxIcon,
  ClipboardDocumentListIcon,
  ChatBubbleLeftEllipsisIcon,
  HeartIcon,
  WrenchScrewdriverIcon,
  ShieldCheckIcon,
  StarIcon, // For "My Reviews"
  DocumentTextIcon // Generic for reports or logs if needed
} from "@heroicons/react/24/outline";
import { useAuthContext } from '../context/AuthContext';
import toast from "react-hot-toast";

export default function Sidebar() {
  const navigate = useNavigate();
  const { currentUser, isAuthenticated, userRole, signout, isLoading: authIsLoading } = useAuthContext();

  const handleSignOut = async () => {
    try {
      await signout();
      // Signout in AuthContext already navigates to '/' and can show a toast.
    } catch (error) {
      console.error("Sidebar: Error during signout:", error);
      toast.error("Failed to sign out. Please try again.");
    }
  };

  let navigationLinks = [];
  const commonAuthenticatedLinks = [
    { label: "Edit Profile", path: "/profile/edit", icon: Cog6ToothIcon }
  ];

  if (isAuthenticated && currentUser) {
    if (userRole === 'BUYER') {
      navigationLinks = [
        { label: "Dashboard", path: "/buyer/dashboard", icon: HomeIcon },
        { label: "My Orders", path: "/buyer/orders", icon: ClipboardDocumentListIcon },
        { label: "My Favorites", path: "/buyer/favorites", icon: HeartIcon },
        { label: "My Reviews", path: "/buyer/reviews", icon: StarIcon },
        { label: "My Messages", path: "/buyer/messages", icon: ChatBubbleLeftEllipsisIcon },
        ...commonAuthenticatedLinks
      ];
    } else if (userRole === 'SELLER') {
      navigationLinks = [
        { label: "Dashboard", path: "/seller/dashboard", icon: BuildingStorefrontIcon },
        { label: "My Products", path: "/seller/products", icon: ArchiveBoxIcon }, // Links to manage, add, edit products
        { label: "Received Orders", path: "/seller/orders", icon: ClipboardDocumentListIcon },
        { label: "Messages", path: "/seller/messages", icon: ChatBubbleLeftEllipsisIcon },
        ...commonAuthenticatedLinks
      ];
    } else if (userRole === 'ADMIN') {
      navigationLinks = [
        { label: "Admin Dashboard", path: "/admin/dashboard", icon: ShieldCheckIcon },
        { label: "User Management", path: "/admin/users", icon: UserGroupIcon },
        { label: "Product Catalog", path: "/admin/products", icon: ArchiveBoxIcon },
        { label: "Order Management", path: "/admin/orders", icon: ClipboardDocumentListIcon },
        { label: "Contact Messages", path: "/admin/contact-messages", icon: EnvelopeIcon },
        { label: "Site Settings", path: "/admin/settings", icon: WrenchScrewdriverIcon },
        // Example: { label: "System Logs", path: "/admin/logs", icon: DocumentTextIcon },
      ];
    }
  } else if (!authIsLoading) {
    // Potentially links for guests if sidebar is shown to them, otherwise this block can be removed.
    // navigationLinks = [
    //   { label: "Home", path: "/", icon: HomeIcon },
    //   { label: "Products", path: "/products", icon: ArchiveBoxIcon },
    // ];
  }

  const userNameDisplay = currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : "Guest";
  const userRoleDisplay = userRole ? `${userRole} Account` : (isAuthenticated ? "User Account" : "Not Signed In");


  if (authIsLoading && !currentUser && !isAuthenticated) {
    return (
        <aside className="h-screen bg-white shadow-2xl flex flex-col sticky top-0 left-0 z-40 print:hidden w-20 md:w-20 lg:w-60">
            <div className="p-2 lg:p-5 border-b border-gray-200 animate-pulse">
                <div className="flex flex-col items-center lg:flex-row lg:items-center lg:gap-3">
                    <div className="h-10 w-10 bg-gray-300 rounded-full"></div>
                    <div className="mt-1 lg:mt-0 text-center lg:text-left hidden lg:block">
                        <div className="h-4 bg-gray-300 rounded w-24 mb-1"></div>
                        <div className="h-3 bg-gray-300 rounded w-16"></div>
                    </div>
                </div>
            </div>
            <nav className="flex-grow p-2 lg:p-4 space-y-1.5 overflow-y-auto">
                {[...Array(4)].map((_, i) => ( // Placeholder for links
                    <div key={i} className="flex flex-col lg:flex-row items-center lg:items-start gap-1 lg:gap-3.5 px-3 lg:px-4 py-2.5 rounded-lg bg-gray-200 animate-pulse">
                        <div className="h-5 w-5 bg-gray-300 rounded"></div>
                        <div className="hidden lg:inline h-4 bg-gray-300 rounded w-32"></div>
                        <div className="lg:hidden h-3 bg-gray-300 rounded w-12 mt-1"></div>
                    </div>
                ))}
            </nav>
             <div className="p-2 lg:p-4 mt-auto border-t border-gray-200 animate-pulse">
                <div className="w-full h-10 bg-gray-300 rounded-lg"></div>
            </div>
        </aside>
    );
  }

  // If not authenticated and no guest links are defined, don't render the sidebar or render a minimal version.
  // For this example, if not authenticated but auth is no longer loading, we assume it's not shown or handled by parent layout.
  // If you want to show it to guests, populate navigationLinks accordingly in the else if block above.
  if (!isAuthenticated && navigationLinks.length === 0 && !authIsLoading) {
      return null; // Or a guest sidebar if you have one
  }


  return (
    <aside className="h-screen bg-white shadow-2xl flex flex-col sticky top-0 left-0 z-40 print:hidden w-20 md:w-20 lg:w-60">
      <div className="p-2 lg:p-5 border-b border-gray-200">
        <div className="flex flex-col items-center lg:flex-row lg:items-center lg:gap-3">
          {currentUser?.photoUrl ? (
             <img src={currentUser.photoUrl} alt="User" className="h-10 w-10 rounded-full object-cover" />
          ) : (
            <UserCircleIcon className="h-10 w-10 text-gray-400" />
          )}
          <div className="mt-1 lg:mt-0 text-center lg:text-left">
            <p
              className="hidden lg:block text-sm font-semibold text-gray-800 capitalize truncate"
              title={userNameDisplay}
            >
              {userNameDisplay}
            </p>
            <p className="hidden lg:block text-xs text-gray-500 capitalize">
              {userRoleDisplay}
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-grow p-2 lg:p-4 space-y-1.5 overflow-y-auto">
        {navigationLinks.map((link) => (
          <NavLink
            key={link.path}
            to={link.path}
            // `end` prop helps NavLink to be active only for exact path matches,
            // especially useful for dashboard-like parent routes.
            end={link.path.endsWith('dashboard') || link.path === "/" || link.path.includes('edit') || link.path.endsWith('reviews')} 
            className={({ isActive }) =>
              `flex flex-col lg:flex-row items-center lg:items-start gap-1 lg:gap-3.5 px-3 lg:px-4 py-2.5 rounded-lg text-xs lg:text-sm font-medium transition-all duration-200 ease-in-out group 
              ${isActive
                ? 'bg-blue-600 text-white shadow-lg transform scale-[1.02]'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`
            }
          >
            {link.icon && React.createElement(link.icon, {
              className: `h-5 w-5 shrink-0 transition-colors group-hover:text-blue-500 
              ${'text-gray-400 group-[.bg-blue-600]:text-white'}` // Icon color based on parent active state
            })}
            <span className="hidden lg:inline">{link.label}</span>
            <span className="lg:hidden text-[10px] text-center block mt-0.5">{link.label}</span>
          </NavLink>
        ))}
      </nav>

      {isAuthenticated && (
        <div className="p-2 lg:p-4 mt-auto border-t border-gray-200">
            <button
            onClick={handleSignOut}
            disabled={authIsLoading}
            className="w-full flex flex-col lg:flex-row items-center gap-1 lg:gap-3 px-3 lg:px-4 py-2.5 rounded-lg text-xs lg:text-sm text-red-600 bg-red-50 hover:bg-red-100 hover:text-red-700 transition-colors duration-150 disabled:opacity-50"
            >
            <ArrowLeftStartOnRectangleIcon className="h-5 w-5 shrink-0 text-red-500" />
            <span className="hidden lg:inline">Sign Out</span>
            <span className="lg:hidden text-[10px] mt-0.5">Sign Out</span>
            </button>
        </div>
      )}
    </aside>
  );
}
