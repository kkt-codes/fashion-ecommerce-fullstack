import React from "react";
import { Link } from "react-router-dom"; // Optional: Add a link to home
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";

export default function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center px-4 py-8 bg-gray-50">
      <ExclamationTriangleIcon className="h-20 w-20 text-yellow-500 mb-6" />
      <h1 className="text-5xl sm:text-6xl font-bold text-gray-800 mb-4">404</h1>
      <h2 className="text-2xl sm:text-3xl font-semibold text-gray-700 mb-3">Page Not Found</h2>
      <p className="text-gray-600 mb-8 max-w-md">
        Oops! The page you're looking for doesn't seem to exist. It might have been moved, deleted, or you might have mistyped the URL.
      </p>
      <Link
        to="/"
        className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-300 font-semibold text-md shadow-md hover:shadow-lg"
      >
        Go Back Home
      </Link>
    </div>
  );
}
