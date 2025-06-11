import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { TruckIcon, PencilIcon, TrashIcon, XMarkIcon, PlusCircleIcon } from '@heroicons/react/24/outline';

import Sidebar from '../../components/Sidebar';
import { getDeliveryOptions, createDelivery, updateDelivery, deleteDelivery } from '../../services/api';

const DeliveryModal = ({ option, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        type: '',
        deliveryCost: '',
        minDeliveryDays: '',
        maxDeliveryDays: ''
    });

    useEffect(() => {
        if (option) {
            setFormData({
                type: option.type || '',
                deliveryCost: option.deliveryCost || '',
                minDeliveryDays: option.minDeliveryDays || '',
                maxDeliveryDays: option.maxDeliveryDays || ''
            });
        } else {
            setFormData({ type: '', deliveryCost: '', minDeliveryDays: '', maxDeliveryDays: '' });
        }
    }, [option]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const toastId = toast.loading(option ? 'Updating option...' : 'Creating option...');
        try {
            const saveData = {
                type: formData.type,
                deliveryCost: parseFloat(formData.deliveryCost) || 0,
                minDeliveryDays: parseInt(formData.minDeliveryDays, 10) || 1,
                maxDeliveryDays: parseInt(formData.maxDeliveryDays, 10) || 1,
            };

            if (option && option.id) {
                await updateDelivery(option.id, saveData);
            } else {
                await createDelivery(saveData);
            }
            toast.success('Delivery option saved successfully!', { id: toastId });
            onSave();
            onClose();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to save option.', { id: toastId });
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md m-4">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">{option ? 'Edit' : 'Create'} Delivery Option</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200"><XMarkIcon className="h-6 w-6" /></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Option Name</label>
                        <input type="text" name="type" value={formData.type} onChange={handleChange} placeholder="e.g., Express Shipping" required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Cost ($)</label>
                        <input type="number" name="deliveryCost" value={formData.deliveryCost} onChange={handleChange} placeholder="e.g., 15.99" required min="0" step="0.01" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Min. Delivery Days</label>
                        <input type="number" name="minDeliveryDays" value={formData.minDeliveryDays} onChange={handleChange} placeholder="e.g., 2" required min="1" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Max. Delivery Days</label>
                        <input type="number" name="maxDeliveryDays" value={formData.maxDeliveryDays} onChange={handleChange} placeholder="e.g., 3" required min="1" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"/>
                    </div>
                    <div className="mt-6 flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Save</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// Main page component
export default function AdminDeliveryManagementPage() {
    const [deliveryOptions, setDeliveryOptions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingOption, setEditingOption] = useState(null);

    // --- REFACTORED: Safer data fetching logic ---
    const fetchOptions = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            // The API response from axios has the actual data in a `data` property
            const response = await getDeliveryOptions();
            const fetchedData = response.data;
            
            // Ensure the data is an array before setting state
            if (Array.isArray(fetchedData)) {
                setDeliveryOptions(fetchedData);
            } else {
                console.error("API did not return an array:", fetchedData);
                setDeliveryOptions([]); // Fallback to an empty array to prevent crash
                setError("Received invalid data from the server.");
            }
        } catch (err) {
            setError('Failed to load delivery options.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchOptions();
    }, [fetchOptions]);

    const handleOpenModal = (option = null) => {
        setEditingOption(option);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingOption(null);
    };

    const handleDelete = (option) => {
        toast((t) => (
            <div>
                <p className="font-semibold">Delete "{option.type}"?</p>
                <p className="text-sm text-gray-600">This action cannot be undone.</p>
                <div className="flex gap-2 mt-3">
                    <button
                        onClick={async () => {
                            toast.dismiss(t.id);
                            const deleteToast = toast.loading('Deleting...');
                            try {
                                await deleteDelivery(option.id);
                                toast.success('Option deleted.', { id: deleteToast });
                                fetchOptions();
                            } catch (err) {
                                toast.error('Failed to delete.', { id: deleteToast });
                            }
                        }}
                        className="px-4 py-1.5 bg-red-600 text-white rounded hover:bg-red-700"
                    >Delete</button>
                    <button onClick={() => toast.dismiss(t.id)} className="px-4 py-1.5 bg-gray-200 rounded hover:bg-gray-300">Cancel</button>
                </div>
            </div>
        ));
    };

    return (
        <div className="flex min-h-screen bg-gray-100">
            {isModalOpen && <DeliveryModal option={editingOption} onClose={handleCloseModal} onSave={fetchOptions} />}
            <Sidebar />
            <main className="flex-1 p-6 sm:p-8">
                <header className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                            <TruckIcon className="h-8 w-8" />
                            Delivery Management
                        </h1>
                        <p className="text-sm text-gray-500 mt-1">Create, edit, and delete shipping options.</p>
                    </div>
                    <button onClick={() => handleOpenModal()} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700">
                        <PlusCircleIcon className="h-5 w-5" /> Create New Option
                    </button>
                </header>

                {isLoading ? <p>Loading options...</p> :
                error ? <p className="text-red-500">{error}</p> :
                (
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Option Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cost</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Est. Days</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {deliveryOptions.map((option) => (
                                    <tr key={option.id}>
                                        <td className="px-6 py-4 text-sm text-gray-500">{option.id}</td>
                                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{option.type}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500">${option.deliveryCost.toFixed(2)}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500">{option.minDeliveryDays} - {option.maxDeliveryDays}</td>
                                        <td className="px-6 py-4 text-right text-sm font-medium space-x-4">
                                            <button onClick={() => handleOpenModal(option)} className="text-indigo-600 hover:text-indigo-900"><PencilIcon className="h-5 w-5 inline-block"/></button>
                                            <button onClick={() => handleDelete(option)} className="text-red-600 hover:text-red-900"><TrashIcon className="h-5 w-5 inline-block"/></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </main>
        </div>
    );
}