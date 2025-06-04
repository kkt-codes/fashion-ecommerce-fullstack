import React, { useEffect, useState } from 'react';
import Sidebar from '../../components/Sidebar';
import apiClient from '../../services/api';
import toast from 'react-hot-toast';
import {
  PencilSquareIcon,
  TrashIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  UserIcon,
} from '@heroicons/react/24/outline';

const USERS_PER_PAGE = 12;

export default function AdminUserManagementPage() {
  const [users, setUsers] = useState([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageError, setPageError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState(null);

  const fetchUsers = async (page = 0) => {
    setLoading(true);
    setPageError(null);
    try {
      // Backend endpoint: GET /admin/users?page={page}&size={USERS_PER_PAGE}&sort=id,ASC
      const response = await apiClient.get(
        `/admin/users?page=${page}&size=${USERS_PER_PAGE}&sort=id,ASC`
      );
      setUsers(response.data?.content || []);
      setTotalUsers(response.data?.totalElements || 0);
      setCurrentPage(response.data?.number || 0);
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to load users.';
      setPageError(errorMsg);
      toast.error(errorMsg);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(currentPage);
  }, [currentPage]);

  const paginate = (newPage) => {
    if (newPage >= 0 && newPage < Math.ceil(totalUsers / USERS_PER_PAGE)) {
      setCurrentPage(newPage);
    }
  };

  const handleDeleteUser = (userId, userName) => {
    toast(
      (t) => (
        <div className="p-4 bg-white rounded shadow-md max-w-xs flex flex-col gap-3">
          <p className="text-sm font-semibold text-gray-800">Delete user "{userName}"?</p>
          <div className="flex gap-2">
            <button
              onClick={async () => {
                toast.dismiss(t.id);
                setDeletingUserId(userId);
                try {
                  await apiClient.delete(`/admin/users/${userId}`);
                  toast.success(`User "${userName}" deleted.`);
                  // Refetch users after delete
                  fetchUsers(currentPage);
                } catch (err) {
                  console.error('Delete user failed:', err.response?.data || err.message);
                  toast.error('Failed to delete user. Please try again.');
                } finally {
                  setDeletingUserId(null);
                }
              }}
              className="flex-1 py-1.5 bg-red-600 text-white rounded hover:bg-red-700 transition"
            >
              Delete
            </button>
            <button
              onClick={() => toast.dismiss(t.id)}
              className="flex-1 py-1.5 bg-gray-200 rounded hover:bg-gray-300 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      ),
      { duration: 60000, position: 'top-center' }
    );
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <main className="flex-1 p-6 sm:p-8 max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">User Management</h1>

        {pageError && (
          <div className="p-4 mb-6 bg-red-100 text-red-700 rounded shadow text-center">{pageError}</div>
        )}

        {loading && users.length === 0 ? (
          <p className="text-center text-gray-600 animate-pulse">Loading users...</p>
        ) : users.length === 0 ? (
          <p className="text-center text-gray-500">No users found.</p>
        ) : (
          <>
            <table className="min-w-full table-auto border-collapse border border-gray-300 rounded-md overflow-hidden shadow-sm bg-white">
              <thead className="bg-gray-50 border-b border-gray-300">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 border-r border-gray-300">ID</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 border-r border-gray-300">Name</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 border-r border-gray-300">Email</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 border-r border-gray-300">Role</th>
                  <th className="px-4 py-2 text-center text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-gray-50 border-b border-gray-300 last:border-b-0"
                  >
                    <td className="px-4 py-3 text-sm text-gray-700 border-r border-gray-300">{user.id}</td>
                    <td className="px-4 py-3 text-sm text-gray-800 border-r border-gray-300 truncate max-w-xs" title={`${user.firstName} ${user.lastName}`}>
                      {user.firstName} {user.lastName}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 border-r border-gray-300 truncate max-w-sm" title={user.email}>
                      {user.email}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 border-r border-gray-300">{user.role}</td>
                    <td className="px-4 py-3 text-center text-sm space-x-2">
                      {/* Edit can be implemented later, for now it just alerts */}
                      <button
                        onClick={() => alert("Edit User functionality to be implemented")}
                        className="inline-flex items-center gap-1 px-2 py-1 text-blue-600 hover:text-blue-800"
                        aria-label={`Edit user ${user.firstName} ${user.lastName}`}
                        title="Edit User"
                      >
                        <PencilSquareIcon className="h-5 w-5" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id, `${user.firstName} ${user.lastName}`)}
                        disabled={deletingUserId === user.id}
                        className="inline-flex items-center gap-1 px-2 py-1 text-red-600 hover:text-red-800 disabled:opacity-50"
                        aria-label={`Delete user ${user.firstName} ${user.lastName}`}
                        title="Delete User"
                      >
                        <TrashIcon className="h-5 w-5" />
                        {deletingUserId === user.id ? 'Deleting...' : 'Delete'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <nav className="flex justify-between items-center mt-6 px-2" aria-label="Pagination">
              <button
                onClick={() => paginate(0)}
                disabled={currentPage === 0 || loading}
                className="px-3 py-1 text-sm rounded-md border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                First
              </button>
              <button
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 0 || loading}
                className="px-4 py-1 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeftIcon className="h-5 w-5" />
              </button>
              <span className="text-sm text-gray-700">
                Page <span className="font-semibold">{currentPage + 1}</span> of{' '}
                <span className="font-semibold">{Math.ceil(totalUsers / USERS_PER_PAGE)}</span>
              </span>
              <button
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage >= Math.ceil(totalUsers / USERS_PER_PAGE) - 1 || loading}
                className="px-4 py-1 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRightIcon className="h-5 w-5" />
              </button>
              <button
                onClick={() => paginate(Math.ceil(totalUsers / USERS_PER_PAGE) - 1)}
                disabled={currentPage >= Math.ceil(totalUsers / USERS_PER_PAGE) - 1 || loading}
                className="px-3 py-1 text-sm rounded-md border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Last
              </button>
            </nav>
          </>
        )}
      </main>
    </div>
  );
}
