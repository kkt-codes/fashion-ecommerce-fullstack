import React, { useEffect, useState, useCallback, useRef } from "react";
import Stomp from 'stompjs';
import SockJS from 'sockjs-client';
import Sidebar from "../../components/Sidebar";
import {
  EnvelopeIcon,
  CheckCircleIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

import { getContactMessages, updateContactMessageStatus, deleteContactMessage } from "../../services/api";

// Helper function to safely parse dates from the backend
const parseJavaLocalDateTime = (dateTime) => {
    if (!dateTime) return new Date(); // Fallback
    // Jackson can serialize LocalDateTime as an array [y, M, d, h, m, s, ns]
    if (Array.isArray(dateTime)) {
        // Month is 1-based in Java, 0-based in JS Date, so subtract 1
        return new Date(dateTime[0], dateTime[1] - 1, dateTime[2], dateTime[3], dateTime[4], dateTime[5]);
    }
    // It can also be a standard ISO string, which is directly parsable
    return new Date(dateTime);
};


export default function AdminContactMessagesPage() {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const stompClientRef = useRef(null);

  const fetchMessages = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data } = await getContactMessages();
      // Use the helper function for sorting
      const sortedData = (data || []).sort((a, b) => parseJavaLocalDateTime(b.createdAt) - parseJavaLocalDateTime(a.createdAt));
      setMessages(sortedData);
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Failed to load contact messages.";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  useEffect(() => {
    const token = localStorage.getItem('appAuthToken');
    if (!token) {
        return; // Don't connect if not logged in
    }
    const headers = { 'Authorization': `Bearer ${token}` };

    const socket = new SockJS('http://localhost:8080/ws');
    const client = Stomp.over(socket);
    stompClientRef.current = client;

    const onNewMessageReceived = (message) => {
        const newContactMessage = JSON.parse(message.body);

        setMessages(prevMessages => {
            // Check if a message with the same ID already exists in our state
            const messageExists = prevMessages.some(msg => msg.id === newContactMessage.id);

            if (!messageExists) {
                // If it doesn't exist, show a notification and add it to the state
                toast.success(`New message from ${newContactMessage.senderName}`, {
                    icon: '📩',
                });
                return [newContactMessage, ...prevMessages];
            }
            
            // If the message already exists, do nothing and return the state as is
            return prevMessages;
        });
    };

    client.connect(headers, 
      () => {
        console.log('STOMP (Admin): Connected');
        client.subscribe('/topic/admin/newContactMessage', onNewMessageReceived);
      },
      (error) => {
        console.error("STOMP (Admin): Connection error", error);
        toast.error("Could not connect to real-time message service.");
      }
    );

    return () => {
        if (stompClientRef.current?.connected) {
            stompClientRef.current.disconnect(() => console.log('STOMP (Admin): Disconnected'));
        }
    };
  }, []); 

  const handleUpdateStatus = async (messageId, newStatus) => {
    const toastId = toast.loading("Updating status...");
    try {
      await updateContactMessageStatus(messageId, newStatus);
      toast.success(`Message marked as ${newStatus}.`, { id: toastId });
      setMessages(prev => prev.map(msg => msg.id === messageId ? { ...msg, status: newStatus } : msg));
    } catch (err) {
      toast.error("Failed to update status.", { id: toastId });
    }
  };

  const handleDeleteMessage = (messageId) => {
    toast((t) => (
      <div className="p-4 bg-white rounded shadow-md">
        <p className="font-semibold">Delete this message?</p>
        <div className="flex gap-2 mt-3">
          <button
            onClick={async () => {
              toast.dismiss(t.id);
              const deleteToast = toast.loading("Deleting message...");
              try {
                await deleteContactMessage(messageId);
                toast.success('Message deleted.', { id: deleteToast });
                setMessages(prev => prev.filter(msg => msg.id !== messageId));
              } catch (err) {
                toast.error('Failed to delete message.', { id: deleteToast });
              }
            }}
            className="px-4 py-1.5 bg-red-600 text-white rounded hover:bg-red-700"
          >Delete</button>
          <button onClick={() => toast.dismiss(t.id)} className="px-4 py-1.5 bg-gray-200 rounded hover:bg-gray-300">Cancel</button>
        </div>
      </div>
    ), { duration: 10000 });
  };

  const getStatusPill = (status) => {
    const isUnread = status.toLowerCase() === 'unread';
    return (
        <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${isUnread ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
            {status}
        </span>
    );
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <main className="flex-1 p-6 sm:p-8">
        <header className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800">Contact Messages</h1>
            <p className="text-sm text-gray-500 mt-1">Review and manage messages submitted by users.</p>
        </header>

        {isLoading ? <p>Loading messages...</p> :
         error ? <p className="text-red-500">{error}</p> :
         messages.length === 0 ? (
            <div className="text-center py-16">
                <EnvelopeIcon className="mx-auto h-16 w-16 text-gray-300" />
                <h2 className="mt-4 text-xl font-semibold text-gray-700">Inbox Zero</h2>
                <p className="mt-1 text-gray-500">No contact messages found.</p>
            </div>
         ) :
         (
            <div className="space-y-4">
              {messages.map((msg) => (
                <div key={msg.id} className="bg-white p-5 rounded-lg shadow border border-gray-200">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-grow">
                      <div className="flex items-center gap-4 mb-2">
                        <h2 className="text-lg font-semibold text-gray-800">{msg.subject}</h2>
                        {getStatusPill(msg.status)}
                      </div>
                      <p className="text-sm text-gray-600">From: {msg.senderName} &lt;{msg.senderEmail}&gt;</p>
                      {/* Use the helper function for rendering the date */}
                      <p className="text-xs text-gray-400 mt-1">{parseJavaLocalDateTime(msg.createdAt).toLocaleString()}</p>
                    </div>
                    <div className="flex items-center space-x-2 flex-shrink-0">
                      {msg.status.toLowerCase() === 'unread' && (
                        <button onClick={() => handleUpdateStatus(msg.id, 'read')} className="text-green-600 hover:text-green-800" title="Mark as Read"><CheckCircleIcon className="h-5 w-5" /></button>
                      )}
                      <button onClick={() => handleDeleteMessage(msg.id)} className="text-red-600 hover:text-red-800" title="Delete Message"><TrashIcon className="h-5 w-5" /></button>
                    </div>
                  </div>
                  <p className="mt-3 text-gray-700 whitespace-pre-wrap border-t pt-3">{msg.message}</p>
                </div>
              ))}
            </div>
         )
        }
      </main>
    </div>
  );
}