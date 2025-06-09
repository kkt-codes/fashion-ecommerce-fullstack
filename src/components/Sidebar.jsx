import React, { useMemo } from "react";
import { NavLink } from "react-router-dom";
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
  StarIcon,
  TruckIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from '../context/AuthContext';

// Define navigation links for each role in a centralized structure
const navConfig = {
  BUYER: [
    { label: "Dashboard", path: "/buyer/dashboard", icon: HomeIcon },
    { label: "My Orders", path: "/buyer/orders", icon: ClipboardDocumentListIcon },
    { label: "My Favorites", path: "/buyer/favorites", icon: HeartIcon },
    { label: "My Reviews", path: "/buyer/reviews", icon: StarIcon },
    { label: "My Messages", path: "/buyer/messages", icon: ChatBubbleLeftEllipsisIcon },
    { label: "Edit Profile", path: "/profile/edit", icon: Cog6ToothIcon }
  ],
  SELLER: [
    { label: "Dashboard", path: "/seller/dashboard", icon: BuildingStorefrontIcon },
    { label: "My Products", path: "/seller/products", icon: ArchiveBoxIcon },
    { label: "Received Orders", path: "/seller/orders", icon: ClipboardDocumentListIcon },
    { label: "Messages", path: "/seller/messages", icon: ChatBubbleLeftEllipsisIcon },
    { label: "Edit Profile", path: "/profile/edit", icon: Cog6ToothIcon }
  ],
  ADMIN: [
    { label: "Dashboard", path: "/admin/dashboard", icon: ShieldCheckIcon },
    { label: "Users", path: "/admin/users", icon: UserGroupIcon },
    { label: "Products", path: "/admin/products", icon: ArchiveBoxIcon },
    { label: "Orders", path: "/admin/orders", icon: ClipboardDocumentListIcon },
    { label: "Messages", path: "/admin/contact-messages", icon: EnvelopeIcon },
    { label: "Delivery", path: "/admin/deliveries", icon: TruckIcon },
    { label: "Settings", path: "/admin/settings", icon: WrenchScrewdriverIcon },
  ]
};

// A reusable NavLink component for the sidebar
const SidebarNavLink = ({ to, icon: Icon, label }) => (
    <NavLink
        to={to}
        end // Ensures active class is only for exact matches
        className={({ isActive }) =>
            `flex flex-col lg:flex-row items-center lg:items-start gap-1 lg:gap-3.5 px-3 lg:px-4 py-2.5 rounded-lg text-xs lg:text-sm font-medium transition-all duration-200 group 
            ${isActive
                ? 'bg-blue-600 text-white shadow-lg'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`
        }
    >
        <Icon className={`h-5 w-5 shrink-0 transition-colors ${'text-gray-400 group-hover:text-blue-500'} group-[.bg-blue-600]:text-white`} />
        <span className="hidden lg:inline">{label}</span>
        <span className="lg:hidden text-[10px] text-center block mt-0.5">{label}</span>
    </NavLink>
);

export default function Sidebar() {
  const { currentUser, userRole, logout, isLoading } = useAuth();

  // Memoize the navigation links to prevent recalculation on every render
  const navigationLinks = useMemo(() => {
    return navConfig[userRole] || [];
  }, [userRole]);

  // Loading skeleton
  if (isLoading && !currentUser) {
    return (
        <aside className="h-screen bg-white shadow-2xl flex flex-col sticky top-0 left-0 z-40 w-20 lg:w-60">
            <div className="p-2 lg:p-5 border-b border-gray-200 animate-pulse">
                <div className="flex flex-col items-center lg:flex-row lg:items-center lg:gap-3">
                    <div className="h-10 w-10 bg-gray-300 rounded-full"></div>
                    <div className="hidden lg:block w-3/4"><div className="h-4 bg-gray-300 rounded w-24 mb-1"></div><div className="h-3 bg-gray-300 rounded w-16"></div></div>
                </div>
            </div>
            <nav className="flex-grow p-2 lg:p-4 space-y-1.5">{[...Array(5)].map((_, i) => (<div key={i} className="h-10 bg-gray-200 rounded-lg animate-pulse"></div>))}</nav>
            <div className="p-2 lg:p-4 mt-auto border-t"><div className="w-full h-10 bg-gray-300 rounded-lg animate-pulse"></div></div>
        </aside>
    );
  }

  // If the user is not authenticated, the sidebar will not render
  if (!currentUser) {
    return null;
  }

  const userNameDisplay = `${currentUser.firstName} ${currentUser.lastName}`;

  return (
    <aside className="h-screen bg-white shadow-2xl flex flex-col sticky top-0 left-0 z-40 w-20 lg:w-60">
      <div className="p-2 lg:p-5 border-b border-gray-200">
        <div className="flex flex-col items-center lg:flex-row lg:items-center lg:gap-3">
          <UserCircleIcon className="h-10 w-10 text-gray-400" />
          <div className="hidden lg:block">
            <p className="text-sm font-semibold text-gray-800 capitalize truncate" title={userNameDisplay}>{userNameDisplay}</p>
            <p className="text-xs text-gray-500 capitalize">{userRole} Account</p>
          </div>
        </div>
      </div>

      <nav className="flex-grow p-2 lg:p-4 space-y-1.5 overflow-y-auto">
        {navigationLinks.map((link) => (
          <SidebarNavLink key={link.path} to={link.path} icon={link.icon} label={link.label} />
        ))}
      </nav>

      <div className="p-2 lg:p-4 mt-auto border-t border-gray-200">
        <button
          onClick={logout}
          disabled={isLoading}
          className="w-full flex flex-col lg:flex-row items-center gap-1 lg:gap-3 px-3 lg:px-4 py-2.5 rounded-lg text-xs lg:text-sm text-red-600 bg-red-50 hover:bg-red-100"
        >
          <ArrowLeftStartOnRectangleIcon className="h-5 w-5 shrink-0 text-red-500" />
          <span className="hidden lg:inline">Sign Out</span>
          <span className="lg:hidden text-[10px] mt-0.5">Sign Out</span>
        </button>
      </div>
    </aside>
  );
}