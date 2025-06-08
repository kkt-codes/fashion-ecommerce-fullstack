import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import Stomp from 'stompjs';
import SockJS from 'sockjs-client';
import { parseISO, isToday, format } from 'date-fns';
import toast from 'react-hot-toast';
import {
  ChatBubbleLeftEllipsisIcon, PaperAirplaneIcon, ArrowLeftIcon, InboxIcon
} from "@heroicons/react/24/outline";

import Sidebar from "../../components/Sidebar";
import { useAuth } from "../../context/AuthContext";
import { getMyConversations, getMessagesForConversation } from "../../services/api";

// Helper to format timestamps
const formatTimestamp = (isoTimestamp) => {
  if (!isoTimestamp) return '';
  const date = parseISO(isoTimestamp);
  return isToday(date) ? format(date, 'p') : format(date, 'MMM d, p');
};

export default function SellerMessagesPage() {
  const { currentUser, isAuthLoading } = useAuth();

  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedConvoId, setSelectedConvoId] = useState(null);
  const [newMessage, setNewMessage] = useState("");
  
  const [isLoadingConvos, setIsLoadingConvos] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  const stompClientRef = useRef(null);
  const messagesEndRef = useRef(null);

  // --- Data Fetching & Callbacks ---
  const fetchConversations = useCallback(async (convoToSelect = null) => {
    setIsLoadingConvos(true);
    try {
      const { data } = await getMyConversations();
      // Sort conversations by the most recent message
      const sortedData = (data || []).sort((a, b) => 
        parseISO(b.lastMessageTimestamp || 0) - parseISO(a.lastMessageTimestamp || 0)
      );
      setConversations(sortedData);
      if (convoToSelect) {
        setSelectedConvoId(convoToSelect);
      }
    } catch (error) {
      toast.error("Could not load your conversations.");
    } finally {
      setIsLoadingConvos(false);
    }
  }, []);
  
  const handleSelectConversation = useCallback(async (conversationId) => {
    setSelectedConvoId(conversationId);
    setIsLoadingMessages(true);
    try {
        const { data } = await getMessagesForConversation(conversationId);
        setMessages(data || []);
        // After fetching, mark messages as read and refresh convo list for unread counts
        // This requires a new API endpoint, which we assume exists
        // await markConversationAsRead(conversationId); 
        fetchConversations(conversationId); // Refetch to update unread status
    } catch (error) {
        toast.error("Could not load messages for this conversation.");
    } finally {
        setIsLoadingMessages(false);
    }
  }, [fetchConversations]);

  // --- WebSocket Logic ---
  useEffect(() => {
    if (!currentUser) return;

    const socket = new SockJS('http://localhost:8080/ws');
    const client = Stomp.over(socket);
    stompClientRef.current = client;

    client.connect({}, () => {
      console.log('STOMP (Seller): Connected');
      client.subscribe('/topic/messages', (message) => {
        const received = JSON.parse(message.body);
        
        // If the message belongs to the currently open conversation, add it to the view
        if (received.conversationId === selectedConvoId) {
          setMessages(prev => [...prev, received]);
          // We could also immediately mark it as read here via an API call
        }
        
        // Always refresh the conversation list to update last message and unread status
        fetchConversations(selectedConvoId);
      });
    });

    return () => {
      if (stompClientRef.current?.connected) {
        stompClientRef.current.disconnect(() => console.log('STOMP (Seller): Disconnected.'));
      }
    };
  }, [currentUser, selectedConvoId, fetchConversations]);

  // --- Initial Load ---
  useEffect(() => {
    if (!isAuthLoading) {
      fetchConversations();
    }
  }, [isAuthLoading, fetchConversations]);

  // --- Auto-scrolling ---
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // --- Event Handlers ---
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !stompClientRef.current?.connected || !selectedConvoId) return;

    const payload = {
      conversationId: selectedConvoId,
      senderId: currentUser.id,
      content: newMessage.trim(),
    };
    stompClientRef.current.send("/app/chat.sendMessage", {}, JSON.stringify(payload));
    setNewMessage("");
  };

  const selectedConvo = useMemo(() => conversations.find(c => c.id === selectedConvoId), [conversations, selectedConvoId]);
  const otherParticipantName = useMemo(() => {
    if (!selectedConvo || !currentUser) return "Conversation";
    return currentUser.id === selectedConvo.user1Id ? selectedConvo.user2Name : selectedConvo.user1Name;
  }, [selectedConvo, currentUser]);

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Conversation List Pane */}
        <div className={`w-full md:w-2/5 lg:w-1/3 xl:w-1/4 border-r bg-white flex flex-col ${selectedConvoId && 'hidden md:flex'}`}>
          <div className="p-4 border-b"><h2 className="text-xl font-semibold text-gray-800">Conversations</h2></div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {isLoadingConvos ? <p className="p-4 text-center text-gray-500">Loading...</p> :
              conversations.length > 0 ? conversations.map(convo => (
                <button key={convo.id} onClick={() => handleSelectConversation(convo.id)} className={`w-full text-left p-3 rounded-lg flex items-start gap-3 transition-colors ${selectedConvoId === convo.id ? 'bg-purple-50' : 'hover:bg-gray-100'}`}>
                  <div className="h-10 w-10 rounded-full bg-gray-300 flex-shrink-0 flex items-center justify-center font-semibold text-gray-600">
                    {(currentUser.id === convo.user1Id ? convo.user2Name[0] : convo.user1Name[0]) || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{currentUser.id === convo.user1Id ? convo.user2Name : convo.user1Name}</p>
                    <p className="text-xs text-gray-500 truncate">{convo.lastMessage || 'No messages yet.'}</p>
                  </div>
                </button>
              )) : <div className="p-8 text-center text-gray-500"><InboxIcon className="h-12 w-12 mx-auto text-gray-300 mb-2" /><p>No conversations yet.</p></div>
            }
          </div>
        </div>
        {/* Message View Pane */}
        <div className={`w-full md:w-3/5 lg:w-2/3 xl:w-3/4 flex flex-col bg-gray-50 ${!selectedConvoId && 'hidden md:flex'}`}>
          {selectedConvoId ? (
            <>
              <div className="p-3 bg-white border-b flex items-center gap-3 shadow-sm">
                <button onClick={() => setSelectedConvoId(null)} className="md:hidden p-2 rounded-full hover:bg-gray-100"><ArrowLeftIcon className="h-5 w-5" /></button>
                <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center font-semibold text-gray-600">{otherParticipantName?.[0] || '?'}</div>
                <h3 className="font-semibold text-gray-800">{otherParticipantName}</h3>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {isLoadingMessages ? <p className="text-center text-gray-500">Loading messages...</p> :
                  messages.map(msg => (
                    <div key={msg.id} className={`flex items-end gap-2 ${msg.senderId === currentUser.id ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] p-3 rounded-xl ${msg.senderId === currentUser.id ? 'bg-purple-600 text-white rounded-br-none' : 'bg-white text-gray-800 rounded-bl-none shadow-sm'}`}>
                        <p className="text-sm">{msg.content}</p>
                        <p className="text-xs mt-1.5 text-right opacity-70">{formatTimestamp(msg.sentAt)}</p>
                      </div>
                    </div>
                  ))}
                <div ref={messagesEndRef} />
              </div>
              <form onSubmit={handleSendMessage} className="p-4 bg-white border-t flex gap-3">
                <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Type your message..." className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500" />
                <button type="submit" className="p-2.5 bg-purple-600 text-white rounded-full shadow-md hover:bg-purple-700 disabled:opacity-50" disabled={!newMessage.trim()}><PaperAirplaneIcon className="h-5 w-5" /></button>
              </form>
            </>
          ) : (
            <div className="hidden md:flex flex-1 flex-col justify-center items-center text-center text-gray-500 p-8">
              <ChatBubbleLeftEllipsisIcon className="h-20 w-20 text-gray-300 mb-4" />
              <h2 className="text-xl font-semibold">Select a conversation</h2>
              <p>Choose a conversation from the list to view your messages.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}