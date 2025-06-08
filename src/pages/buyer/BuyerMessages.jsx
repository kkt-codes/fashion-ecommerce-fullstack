import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { useLocation, useNavigate } from 'react-router-dom';
import Stomp from 'stompjs';
import SockJS from 'sockjs-client';
import { formatDistanceToNowStrict, parseISO, isToday, format } from 'date-fns';
import toast from 'react-hot-toast';
import {
  ChatBubbleLeftEllipsisIcon, PaperAirplaneIcon, ArrowLeftIcon, InboxIcon
} from "@heroicons/react/24/outline";

import Sidebar from "../../components/Sidebar";
import { useAuth } from "../../context/AuthContext";
import { getMyConversations, getMessagesForConversation, startConversation } from "../../services/api";

// Helper to format timestamps for display
const formatTimestamp = (isoTimestamp) => {
  if (!isoTimestamp) return '';
  const date = parseISO(isoTimestamp);
  return isToday(date) ? format(date, 'p') : format(date, 'MMM d, p');
};

// Main Component
export default function BuyerMessagesPage() {
  const { currentUser, isAuthLoading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedConvoId, setSelectedConvoId] = useState(null);
  const [newMessage, setNewMessage] = useState("");
  
  const [isLoadingConvos, setIsLoadingConvos] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const stompClientRef = useRef(null);
  const messagesEndRef = useRef(null);

  // --- Data Fetching ---
  const fetchConversations = useCallback(async (convoToSelect = null) => {
    setIsLoadingConvos(true);
    try {
      const { data } = await getMyConversations();
      setConversations(data || []);
      if (convoToSelect) {
        setSelectedConvoId(convoToSelect);
      }
    } catch (error) {
      toast.error("Could not load your conversations.");
    } finally {
      setIsLoadingConvos(false);
    }
  }, []);
  
  // --- WebSocket Logic ---
  useEffect(() => {
    if (!currentUser) return;

    const socket = new SockJS('http://localhost:8080/ws');
    const client = Stomp.over(socket);
    stompClientRef.current = client;

    client.connect({}, () => {
      console.log('STOMP: Connected');
      client.subscribe('/topic/messages', (message) => {
        const received = JSON.parse(message.body);
        if (received.conversationId === selectedConvoId) {
          setMessages(prev => [...prev, received]);
        }
        // Refresh conversation list to show new message preview
        fetchConversations(selectedConvoId);
      });
    });

    return () => {
      if (client.connected) client.disconnect(() => console.log('STOMP: Disconnected.'));
    };
  }, [currentUser, selectedConvoId, fetchConversations]);

  // --- Initial Load & Conversation Selection ---
  useEffect(() => {
    const { state } = location;
    if (state?.openWithSellerId) {
      const handleStartConversation = async () => {
        try {
          const { data } = await startConversation(currentUser.id, state.openWithSellerId);
          if (state.productContext?.name) {
            setNewMessage(`Regarding: ${state.productContext.name}\n\n`);
          }
          fetchConversations(data.id);
        } catch (error) {
          toast.error("Failed to start chat.");
          fetchConversations();
        } finally {
          navigate(location.pathname, { replace: true, state: {} });
        }
      };
      handleStartConversation();
    } else {
      fetchConversations();
    }
  }, [location, currentUser, navigate, fetchConversations]);

  useEffect(() => {
    if (selectedConvoId) {
      const fetchMessages = async () => {
        setIsLoadingMessages(true);
        try {
          const { data } = await getMessagesForConversation(selectedConvoId);
          setMessages(data || []);
        } catch (error) {
          toast.error("Could not load messages.");
        } finally {
          setIsLoadingMessages(false);
        }
      };
      fetchMessages();
    } else {
      setMessages([]);
    }
  }, [selectedConvoId]);

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
          <div className="p-4 border-b"><h2 className="text-xl font-semibold">Messages</h2></div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {isLoadingConvos ? <p className="p-4 text-center">Loading...</p> :
              conversations.map(convo => (
                <button key={convo.id} onClick={() => setSelectedConvoId(convo.id)} className={`w-full text-left p-3 rounded-lg flex items-start gap-3 ${selectedConvoId === convo.id ? 'bg-blue-50' : 'hover:bg-gray-100'}`}>
                  <div className="h-10 w-10 rounded-full bg-gray-300 flex-shrink-0"></div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{currentUser.id === convo.user1Id ? convo.user2Name : convo.user1Name}</p>
                    <p className="text-xs text-gray-500 truncate">{convo.lastMessage || '...'}</p>
                  </div>
                </button>
              ))
            }
          </div>
        </div>
        {/* Message View Pane */}
        <div className={`w-full md:w-3/5 lg:w-2/3 xl:w-3/4 flex flex-col ${!selectedConvoId && 'hidden md:flex'}`}>
          {selectedConvoId ? (
            <>
              <div className="p-3 bg-white border-b flex items-center gap-3">
                <button onClick={() => setSelectedConvoId(null)} className="md:hidden p-2 rounded-full hover:bg-gray-100"><ArrowLeftIcon className="h-5 w-5" /></button>
                <div className="h-10 w-10 rounded-full bg-gray-300"></div>
                <h3 className="font-semibold">{otherParticipantName}</h3>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {isLoadingMessages ? <p>Loading messages...</p> :
                  messages.map(msg => (
                    <div key={msg.id} className={`flex ${msg.senderId === currentUser.id ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] p-3 rounded-xl ${msg.senderId === currentUser.id ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>
                        <p className="text-sm">{msg.content}</p>
                        <p className="text-xs mt-1 text-right opacity-80">{formatTimestamp(msg.sentAt)}</p>
                      </div>
                    </div>
                  ))}
                <div ref={messagesEndRef} />
              </div>
              <form onSubmit={handleSendMessage} className="p-4 bg-white border-t flex gap-3">
                <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Type a message..." className="flex-1 px-4 py-2 border rounded-full" />
                <button type="submit" className="p-2.5 bg-blue-600 text-white rounded-full" disabled={!newMessage.trim()}><PaperAirplaneIcon className="h-5 w-5" /></button>
              </form>
            </>
          ) : (
            <div className="hidden md:flex flex-1 flex-col justify-center items-center text-center text-gray-500 p-8">
              <ChatBubbleLeftEllipsisIcon className="h-20 w-20 text-gray-300 mb-4" />
              <h2 className="text-xl font-semibold">Select a conversation</h2>
              <p>Choose a conversation to view messages.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}