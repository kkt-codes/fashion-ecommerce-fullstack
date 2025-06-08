import { useEffect, useState, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Bars3Icon,
  XMarkIcon,
  UserIcon,
  ShoppingCartIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';

import { useAuth } from '../context/AuthContext';
import { useSignupSigninModal } from '../hooks/useSignupSigninModal';
import { useCart } from '../context/CartContext';

const isActive = (path, current) => path === current;

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const searchContainerRef = useRef(null);
  const profileDropdownRef = useRef(null);

  const { currentUser, logout } = useAuth(); 
  const { openModal, switchToTab } = useSignupSigninModal();
  const { getItemCount } = useCart();

  const isAuthenticated = !!currentUser;
  const cartItemCount = getItemCount ? getItemCount() : 0;

  // --- FIX: All logic for hiding the navbar is removed ---

  const handleLogout = () => {
    logout();
    setDropdownOpen(false);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchValue.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchValue.trim())}`);
      setSearchVisible(false);
      setSearchValue('');
    }
  };

  const toggleSearch = () => setSearchVisible(!searchVisible);

  useEffect(() => {
    if (mobileOpen) setMobileOpen(false);
  }, [location.pathname, mobileOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(event.target)
      ) {
        setDropdownOpen(false);
      }
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target)
      ) {
        setSearchVisible(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const userInitials =
    currentUser?.firstName && currentUser?.lastName
      ? `${currentUser.firstName.charAt(0)}${currentUser.lastName.charAt(0)}`
      : currentUser?.email
      ? currentUser.email.charAt(0).toUpperCase()
      : 'U';
    
  // --- FIX: Reverted from 'fixed' back to 'sticky' for original behavior ---
  return (
    <nav className="bg-white shadow-md sticky top-0 w-full z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between">
          {/* Left Section */}
          <div className="flex items-center">
            <div className="md:hidden">
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="p-2 rounded text-gray-600 hover:bg-gray-100"
                aria-label="Toggle Menu"
              >
                {mobileOpen ? (
                  <XMarkIcon className="h-6 w-6" />
                ) : (
                  <Bars3Icon className="h-6 w-6" />
                )}
              </button>
            </div>
            <Link to="/" className="flex-shrink-0 hidden md:block">
              <img
                className="h-8 w-auto"
                src="/assets/logo.png"
                alt="Company Logo"
              />
            </Link>
          </div>

          {/* Center Section */}
          <div className="md:hidden flex-1 flex justify-center px-2">
            <Link to="/" className="flex-shrink-0">
              <img
                className="h-8 w-auto"
                src="/assets/logo.png"
                alt="Company Logo"
              />
            </Link>
          </div>
          <div className="hidden md:flex flex-1 justify-center items-baseline space-x-8">
            {[
              { label: 'Home', path: '/' },
              { label: 'Products', path: '/products' },
              { label: 'About', path: '/about' },
              { label: 'Contact', path: '/contact' },
            ].map(({ label, path }) => (
              <Link
                key={path}
                to={path}
                className={`font-semibold pb-1 ${
                  isActive(path, location.pathname)
                    ? 'border-b-2 border-indigo-600 text-indigo-600'
                    : 'text-gray-700 hover:text-indigo-600 border-b-2 border-transparent'
                }`}
              >
                {label}
              </Link>
            ))}
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div ref={searchContainerRef} className="flex items-center">
              {searchVisible && (
                <form onSubmit={handleSearchSubmit} className="mr-1">
                  <input
                    type="text"
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    className="border border-gray-300 rounded-l-md px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-sm w-32 sm:w-40 transition-all duration-300"
                    placeholder="Search..."
                    autoFocus
                  />
                </form>
              )}
              <button
                onClick={
                  searchVisible && searchValue.trim()
                    ? handleSearchSubmit
                    : toggleSearch
                }
                type="button"
                className={`p-2 hover:bg-gray-100 rounded-full text-gray-700`}
                aria-label={searchVisible ? 'Submit search' : 'Open search'}
              >
                <MagnifyingGlassIcon className="h-6 w-6" />
              </button>
            </div>

            <button
              onClick={() => navigate('/cart')}
              className="relative p-2 hover:bg-gray-100 rounded-full text-gray-700"
              aria-label="Shopping Cart"
            >
              <ShoppingCartIcon className="h-6 w-6" />
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-xs font-semibold px-1.5 py-0.5 rounded-full">
                  {cartItemCount}
                </span>
              )}
            </button>

            <div ref={profileDropdownRef} className="relative">
              {!isAuthenticated ? (
                <button
                  onClick={() => {
                    openModal();
                    if (switchToTab) switchToTab('signin');
                  }}
                  className="p-2 rounded-full hover:bg-gray-100"
                  aria-label="Sign In / Sign Up"
                >
                  <UserIcon className="h-6 w-6 text-gray-700" />
                </button>
              ) : (
                <>
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="w-10 h-10 flex items-center justify-center bg-indigo-600 text-white rounded-full font-semibold hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    {userInitials}
                  </button>
                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white shadow-lg rounded-md border border-gray-200 z-50 text-sm origin-top-right">
                      <div className="px-4 py-3 border-b border-gray-200">
                        <p className="font-semibold text-gray-800 truncate">
                          {currentUser.firstName || 'User'} {currentUser.lastName || ''}
                        </p>
                        <p className="text-gray-500 truncate">{currentUser.email}</p>
                      </div>
                      <Link
                        to={`/${currentUser.role?.toLowerCase()}/dashboard`}
                        onClick={() => setDropdownOpen(false)}
                        className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 hover:text-indigo-600"
                      >
                        Dashboard
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 hover:text-red-700"
                      >
                        Sign Out
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-white shadow-lg border-t border-gray-200 z-40">
          <div className="flex flex-col items-start gap-1 px-4 py-3">
            {[
              { label: 'Home', path: '/' },
              { label: 'Products', path: '/products' },
              { label: 'About', path: '/about' },
              { label: 'Contact', path: '/contact' },
            ].map(({ label, path }) => (
              <Link
                key={path}
                to={path}
                onClick={() => setMobileOpen(false)}
                className={`block w-full py-2 px-3 rounded-md hover:bg-gray-100 hover:text-indigo-600 font-semibold ${
                  isActive(path, location.pathname)
                    ? 'text-indigo-600 bg-indigo-50'
                    : 'text-gray-700'
                }`}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}