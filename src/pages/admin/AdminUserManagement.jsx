import React, { useEffect, useState, useCallback } from 'react';
import Sidebar from '../../components/Sidebar';
import {
  PencilSquareIcon,
  TrashIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
  UserPlusIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

import { useAuth } from '../../context/AuthContext';
import { getAllUsers, deleteUser, updateUser } from '../../services/api';

const USERS_PER_PAGE = 15;

// Modal for Editing a User
const EditUserModal = ({ user, onClose, onUserUpdate }) => {
    const [formData, setFormData] = useState({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        role: user.role || 'BUYER',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        const toastId = toast.loading("Updating user...");
        try {
            await updateUser(user.id, formData);
            toast.success("User updated successfully!", { id: toastId });
            onUserUpdate(); // Callback to refresh the user list
            onClose();
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to update user.", { id: toastId });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg m-4">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">Edit User: {user.firstName} {user.lastName}</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200"><XMarkIcon className="h-6 w-6" /></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">First Name</label>
                        <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"/>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700">Last Name</label>
                        <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <input type="email" name="email" value={formData.email} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Role</label>
                        <select name="role" value={formData.role} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm">
                            <option value="BUYER">Buyer</option>
                            <option value="SELLER">Seller</option>
                            <option value="ADMIN">Admin</option>
                        </select>
                    </div>
                    <div className="mt-6 flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancel</button>
                        <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400">
                            {isSubmitting ? "Saving..." : "Save Changes"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default function AdminUserManagementPage() {
    const [usersData, setUsersData] = useState({ content: [], totalPages: 0 });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(0);

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const { currentUser } = useAuth();


    const fetchUsers = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const params = { page: currentPage, size: USERS_PER_PAGE, sort: "id,ASC" };
            const { data } = await getAllUsers(params);
            // Check if the response is a proper pagination object
            if (data && data.content) {
                setUsersData(data);
            } 
            // Handle if the response is just a simple array
            else if (Array.isArray(data)) {
                // This prevents the crash but means pagination info is missing from the backend.
                // We'll wrap the array in the expected structure.
                setUsersData({ content: data, totalPages: 1 });
            } 
            // Handle other unexpected formats
            else {
                setUsersData({ content: [], totalPages: 0 });
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load users.');
            // Ensure state is clean on error to prevent render issues
            setUsersData({ content: [], totalPages: 0 });
        } finally {
            setIsLoading(false);
        }
    }, [currentPage]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const handleEditUser = (user) => {
        setSelectedUser(user);
        setIsEditModalOpen(true);
    };

    const handleDeleteUser = (userId, userName) => {
        if (userId === currentUser?.id) {
            toast.error("You cannot delete your own admin account.");
            return;
        }
        toast((t) => (
            <div className="p-4 bg-white rounded shadow-md">
                <p className="font-semibold">Delete user "{userName}"?</p>
                <div className="flex gap-2 mt-3">
                    <button
                        onClick={async () => {
                            toast.dismiss(t.id);
                            const deleteToast = toast.loading("Deleting user...");
                            try {
                                await deleteUser(userId);
                                toast.success(`User "${userName}" deleted.`, { id: deleteToast });
                                fetchUsers();
                            } catch (err) {
                                toast.error('Failed to delete user.', { id: deleteToast });
                            }
                        }}
                        className="px-4 py-1.5 bg-red-600 text-white rounded hover:bg-red-700"
                    >Delete</button>
                    <button onClick={() => toast.dismiss(t.id)} className="px-4 py-1.5 bg-gray-200 rounded hover:bg-gray-300">Cancel</button>
                </div>
            </div>
        ), { duration: 10000 });
    };

    return (
        <div className="flex min-h-screen bg-gray-100">
            {isEditModalOpen && selectedUser && (
                <EditUserModal 
                    user={selectedUser} 
                    onClose={() => setIsEditModalOpen(false)} 
                    onUserUpdate={() => {
                        setIsEditModalOpen(false);
                        fetchUsers();
                    }}
                />
            )}
            <Sidebar />
            <main className="flex-1 p-6 sm:p-8">
                <header className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold text-gray-800">User Management</h1>
                    {/* Placeholder for a "Create User" button */}
                    <button className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700">
                        <UserPlusIcon className="h-5 w-5" /> Create User
                    </button>
                </header>

                {isLoading && usersData.content.length === 0 ? <p>Loading users...</p> :
                error ? <p className="text-red-500">{error}</p> :
                (
                    <div className="bg-white rounded-lg shadow overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {usersData.content.map((user) => (
                                    <tr key={user.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.firstName} {user.lastName}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.role}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                            <button onClick={() => handleEditUser(user)} className="text-indigo-600 hover:text-indigo-900">Edit</button>
                                            <button onClick={() => handleDeleteUser(user.id, `${user.firstName} ${user.lastName}`)} className="text-red-600 hover:text-red-900">Delete</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {/* Pagination */}
                        {usersData.totalPages > 1 && (
                            <div className="px-6 py-3 flex justify-between items-center">
                                <span className="text-sm text-gray-700">Page {currentPage + 1} of {usersData.totalPages}</span>
                                <div className="space-x-1">
                                    <button onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 0} className="px-3 py-1 border rounded-md disabled:opacity-50"><ChevronLeftIcon className="h-4 w-4"/></button>
                                    <button onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage >= usersData.totalPages - 1} className="px-3 py-1 border rounded-md disabled:opacity-50"><ChevronRightIcon className="h-4 w-4"/></button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}