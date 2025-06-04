import React, { useEffect, useState } from "react";
import Sidebar from "../../components/Sidebar";
import apiClient from "../../services/api";
import toast from "react-hot-toast";
import {
  EnvelopeIcon,
  CheckCircleIcon,
  TrashIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";

const MESSAGES_PER_PAGE = 12;

export default function AdminContactMessages() {
  const [messages, setMessages] = useState([]);
  const [totalMessages, setTotalMessages] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [pageError, setPageError] = useState(null);
  const [processingMessageId, setProcessingMessageId] = useState(null);

  const fetchMessages = async (page = 0) => {
    setLoading(true);
    setPageError(null);
    try {
      // Backend endpoint: GET /admin/contact-messages?page={page}&size={MESSAGES_PER_PAGE}&sort=date,DESC
      const response = await apiClient.get(
        `/admin/contact-messages?page=${page}&size=${MESSAGES_PER_PAGE}&sort=date,DESC`
      );
      setMessages(response.data?.content || []);
      setTotalMessages(response.data?.totalElements || 0);
      setCurrentPage(response.data?.number || 0);
    } catch (error) {
      const errorMsg =
        error.response?.data?.message || "Failed to load contact messages.";
      setPageError(errorMsg);
      toast.error(errorMsg);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages(currentPage);
  }, [currentPage]);

  const paginate = (page) => {
    if (page >= 0 && page < Math.ceil(totalMessages / MESSAGES_PER_PAGE)) {
      setCurrentPage(page);
    }
  };

  const markAsResolved = async (messageId) => {
    setProcessingMessageId(messageId);
    try {
      await apiClient.post(`/admin/contact-messages/${messageId}/resolve`);
      toast.success("Message marked as resolved.");
      // Refresh list after update
      fetchMessages(currentPage);
    } catch (error) {
      console.error(
        "Error marking message as resolved:",
        error.response?.data || error.message
      );
      toast.error("Failed to mark as resolved.");
    } finally {
      setProcessingMessageId(null);
    }
  };

  const deleteMessage = (messageId) => {
    toast(
      (t) => (
        <div className="max-w-xs p-4 bg-white rounded shadow-md flex flex-col gap-3">
          <p className="text-sm font-semibold text-gray-800">
            Delete this message?
          </p>
          <div className="flex gap-2">
            <button
              onClick={async () => {
                toast.dismiss(t.id);
                setProcessingMessageId(messageId);
                try {
                  await apiClient.delete(`/admin/contact-messages/${messageId}`);
                  toast.success("Message deleted.");
                  fetchMessages(currentPage);
                } catch (error) {
                  console.error(
                    "Delete message failed:",
                    error.response?.data || error.message
                  );
                  toast.error("Failed to delete message.");
                } finally {
                  setProcessingMessageId(null);
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
      { duration: 60000, position: "top-center" }
    );
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <main className="flex-1 p-6 sm:p-8 max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">Contact Messages</h1>

        {pageError && (
          <div className="p-4 mb-6 bg-red-100 text-red-700 rounded shadow text-center">
            {pageError}
          </div>
        )}

        {loading && messages.length === 0 ? (
          <p className="text-center text-gray-600 animate-pulse">
            Loading contact messages...
          </p>
        ) : messages.length === 0 ? (
          <p className="text-center text-gray-500">
            No contact messages found.
          </p>
        ) : (
          <>
            <ul className="space-y-4">
              {messages.map((msg) => (
                <li
                  key={msg.id}
                  className="bg-white p-5 rounded-lg shadow border border-gray-200"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-3">
                      <EnvelopeIcon className="h-8 w-8 text-blue-600" />
                      <div>
                        <p className="font-semibold text-gray-800">
                          {msg.subject || "No Subject"}
                        </p>
                        <p className="text-sm text-gray-600">
                          From: {msg.senderName || "Unknown"} &lt;{msg.email || "N/A"}&gt;
                        </p>
                        <p className="text-xs text-gray-400">
                          {msg.date ? new Date(msg.date).toLocaleString() : "Date unavailable"}
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      {!msg.resolved && (
                        <button
                          onClick={() => markAsResolved(msg.id)}
                          disabled={processingMessageId === msg.id}
                          className="flex items-center gap-1 text-green-600 hover:text-green-800 text-sm font-medium"
                        >
                          <CheckCircleIcon className="h-5 w-5" />
                          {processingMessageId === msg.id ? 'Processing...' : 'Mark as Resolved'}
                        </button>
                      )}
                      <button
                        onClick={() => deleteMessage(msg.id)}
                        disabled={processingMessageId === msg.id}
                        className="flex items-center gap-1 text-red-600 hover:text-red-800 text-sm font-medium disabled:opacity-50"
                      >
                        <TrashIcon className="h-5 w-5" />
                        Delete
                      </button>
                    </div>
                  </div>
                  <p className="mt-3 text-gray-700 whitespace-pre-wrap">{msg.message}</p>
                  {msg.resolved && (
                    <p className="mt-2 text-xs text-green-600 font-semibold">
                      Resolved
                    </p>
                  )}
                </li>
              ))}
            </ul>

            <nav
              className="flex justify-between items-center mt-6 px-2"
              aria-label="Pagination"
            >
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
                Page <span className="font-semibold">{currentPage + 1}</span> of{" "}
                <span className="font-semibold">
                  {Math.ceil(totalMessages / MESSAGES_PER_PAGE)}
                </span>
              </span>
              <button
                onClick={() => paginate(currentPage + 1)}
                disabled={
                  currentPage >= Math.ceil(totalMessages / MESSAGES_PER_PAGE) - 1 ||
                  loading
                }
                className="px-4 py-1 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRightIcon className="h-5 w-5" />
              </button>
              <button
                onClick={() =>
                  paginate(Math.ceil(totalMessages / MESSAGES_PER_PAGE) - 1)
                }
                disabled={
                  currentPage >= Math.ceil(totalMessages / MESSAGES_PER_PAGE) - 1 ||
                  loading
                }
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
