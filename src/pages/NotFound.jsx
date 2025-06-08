import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeftIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

/**
 * A user-friendly page displayed when a route is not found (404 Error).
 * It provides a clear message and a link to navigate back to the homepage.
 */
export default function NotFoundPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 px-4">
      <div className="w-full max-w-lg text-center bg-white p-8 sm:p-12 rounded-2xl shadow-2xl">
        <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-yellow-100 mb-6 animate-pulse">
            <ExclamationTriangleIcon className="h-12 w-12 text-yellow-500" />
        </div>
        <h1 className="text-6xl sm:text-7xl font-bold text-gray-800 tracking-tighter mb-4">
          404
        </h1>
        <h2 className="text-2xl sm:text-3xl font-semibold text-gray-700 mb-4">
          Page Not Found
        </h2>
        <p className="text-gray-600 mb-8">
          Sorry, we couldn't find the page you were looking for. It might have been moved, deleted, or the URL was mistyped.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors duration-300 shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <ArrowLeftIcon className="h-5 w-5" />
          Go Back Home
        </Link>
      </div>
    </div>
  );
}