const global = window;

import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import Sidebar from "../../components/Sidebar";
import { useAuthContext } from "../../context/AuthContext";
import apiClient from "../../services/api";
import toast from 'react-hot-toast';
import {
  ChatBubbleLeftEllipsisIcon, PaperAirplaneIcon, ArrowLeftIcon,
  InboxIcon
} from "@heroicons/react/24/outline";
import { formatDistanceToNowStrict, parseISO, isToday, format } from 'date-fns';

// No need for useLocation, useNavigate for initial state from ContactSellerButton in this Seller view.

// Helper to format timestamp (same as in BuyerMessages)
const formatMessageTimestamp = (isoTimestamp) => {
  if (!isoTimestamp) return '';
  const date = parseISO(isoTimestamp);
  if (isToday(date)) {
    return format(date, 'p'); // e.g., 2:30 PM
  }
  return format(date, 'MMM d, p'); // e.g., Jun 3, 2:30 PM
};

// Component for an individual conversation in the list
const ConversationListItem = ({ conversation, onSelectConversation, isActive, currentUserId }) => {
  // Backend ConversationDto: id, user1Id, user1Name, user2Id, user2Name, lastMessage, lastMessageTimestamp, unreadMessagesCountForUser1, unreadMessagesCountForUser2
  const otherParticipant = currentUserId === conversation.user1Id 
    ? { id: conversation.user2Id, name: conversation.user2Name || `User ${conversation.user2Id?.slice(-4)}` } 
    : { id: conversation.user1Id, name: conversation.user1Name || `User ${conversation.user1Id?.slice(-4)}` };
  
  const lastMessageText = conversation.lastMessage || "No messages yet...";
  const lastMessageTimestamp = conversation.lastMessageTimestamp;
  
  let unreadMessagesCount = 0;
  if (currentUserId === conversation.user1Id) {
    unreadMessagesCount = conversation.unreadMessagesCountForUser1 || 0;
  } else if (currentUserId === conversation.user2Id) {
    unreadMessagesCount = conversation.unreadMessagesCountForUser2 || 0;
  }
  const isUnread = unreadMessagesCount > 0;

  return (
    <button
      onClick={() => onSelectConversation(conversation.id)}
      className={`w-full text-left p-3 hover:bg-gray-100 rounded-lg transition-colors duration-150 flex items-start space-x-3
        ${isActive ? 'bg-blue-50 shadow-sm' : ''}
        ${isUnread ? 'font-semibold' : ''}`}
    >
      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-500 text-sm overflow-hidden">
        {otherParticipant.name?.charAt(0).toUpperCase() || '?'}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center">
          <p className={`truncate text-sm ${isUnread ? 'text-blue-600 font-bold' : 'text-gray-800'}`}>
            {otherParticipant.name}
          </p>
          {lastMessageTimestamp && (
            <p className={`text-xs whitespace-nowrap ${isUnread ? 'text-blue-500 font-medium' : 'text-gray-400'}`}>
              {formatMessageTimestamp(lastMessageTimestamp)}
            </p>
          )}
        </div>
        <div className="flex justify-between items-center mt-1">
          <p className={`truncate text-xs ${isUnread ? 'text-gray-700' : 'text-gray-500'}`}>
            {lastMessageText}
          </p>
          {isUnread && unreadMessagesCount > 0 && (
            <span className="ml-2 px-2 py-0.5 text-xs font-bold text-white bg-red-500 rounded-full">
              {unreadMessagesCount}
            </span>
          )}
        </div>
      </div>
    </button>
  );
};

// Component for displaying a single chat message
const ChatMessageBubble = ({ message, currentUserId }) => {
  // Backend MessageDto: id, conversationId, senderId, senderName, content, sentAt, isRead
  const isCurrentUserSender = message.senderId === currentUserId;
  const senderName = message.senderName || 'Unknown';

  return (
    <div className={`flex mb-3 ${isCurrentUserSender ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[70%] p-3 rounded-xl shadow-sm ${
        isCurrentUserSender 
          ? 'bg-purple-500 text-white rounded-br-none' // Seller's messages (example color)
          : 'bg-gray-200 text-gray-800 rounded-bl-none' // Other user's messages
      }`}>
        {!isCurrentUserSender && (
          <p className="text-xs font-semibold mb-0.5 text-gray-600">{senderName}</p>
        )}
        <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
        <p className={`text-xs mt-1.5 opacity-80 text-right ${isCurrentUserSender ? 'text-purple-100' : 'text-gray-500'}`}>
          {message.sentAt ? formatMessageTimestamp(message.sentAt) : 'sending...'}
        </p>
      </div>
    </div>
  );
};


export default function SellerMessagesPage() { // Renamed for clarity
  const { currentUser, isAuthenticated, userRole, isLoading: isAuthLoading } = useAuthContext();
  
  const [conversations, setConversations] = useState([]);
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [selectedConversationMessages, setSelectedConversationMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const stompClientRef = useRef(null);
  const subscriptionsRef = useRef({});
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [selectedConversationMessages]);

  const loadConversations = useCallback(async (selectConvId = null) => {
    if (!currentUser || userRole !== 'SELLER') {
      setConversations([]);
      setIsLoadingConversations(false);
      return;
    }
    setIsLoadingConversations(true);
    try {
      const response = await apiClient.get(`/chat/user/me/conversations`); // Uses authenticated user
      const fetchedConversations = response.data || [];
      setConversations(fetchedConversations);

      if (selectConvId && fetchedConversations.some(c => c.id === selectConvId)) {
        setSelectedConversationId(selectConvId);
      } else if (fetchedConversations.length > 0 && !selectedConversationId) {
        // Optionally auto-select the first conversation
        // setSelectedConversationId(fetchedConversations[0].id);
      }
    } catch (error) {
      console.error("Error fetching seller conversations:", error.response?.data || error.message);
      toast.error("Could not load your conversations.");
    } finally {
      setIsLoadingConversations(false);
    }
  }, [currentUser, userRole, selectedConversationId]);

  useEffect(() => {
    if (!isAuthLoading && isAuthenticated && userRole === 'SELLER') {
      loadConversations();
    } else if (!isAuthLoading && (!isAuthenticated || userRole !== 'SELLER')) {
        setConversations([]); // Clear conversations if not an authenticated seller
        setSelectedConversationId(null);
        setSelectedConversationMessages([]);
        setIsLoadingConversations(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthLoading, isAuthenticated, userRole, currentUser]); // Rerun if auth state changes

  useEffect(() => {
    if (selectedConversationId && currentUser) {
      const fetchMessages = async () => {
        setIsLoadingMessages(true);
        try {
          const response = await apiClient.get(`/chat/conversation/${selectedConversationId}/messages`);
          setSelectedConversationMessages(response.data || []);
          // Mark messages as read
          await apiClient.post(`/chat/conversation/${selectedConversationId}/mark-read`);
          // Refresh conversation list to update unread counts after marking as read
          loadConversations(selectedConversationId); 
        } catch (error) {
          console.error(`Error fetching messages for conversation ${selectedConversationId}:`, error.response?.data || error.message);
          toast.error("Could not load messages for this conversation.");
        } finally {
          setIsLoadingMessages(false);
        }
      };
      fetchMessages();
    } else {
      setSelectedConversationMessages([]);
    }
  }, [selectedConversationId, currentUser, loadConversations]);

  // WebSocket/STOMP Setup (Similar to BuyerMessages)
  useEffect(() => {
    if (!currentUser || !isAuthenticated || userRole !== 'SELLER') {
      if (stompClientRef.current && stompClientRef.current.connected) {
        stompClientRef.current.disconnect(() => console.log("STOMP (Seller): Disconnected due to auth change."));
        stompClientRef.current = null;
        subscriptionsRef.current = {};
      }
      return;
    }

    if (!stompClientRef.current || !stompClientRef.current.connected) {
        const socket = new SockJS('http://localhost:8080/ws');
        const stompClient = Stomp.over(socket);
        stompClientRef.current = stompClient;

        stompClient.connect({}, (frame) => {
            console.log('STOMP (Seller): Connected: ' + frame);
            
            const generalSub = stompClient.subscribe('/topic/messages', (message) => {
                const receivedMessage = JSON.parse(message.body);
                if (receivedMessage.conversationId === selectedConversationId) {
                    setSelectedConversationMessages(prevMessages => [...prevMessages, receivedMessage]);
                    // Update last message in conversation list
                     setConversations(prevConvos => prevConvos.map(c => 
                        c.id === receivedMessage.conversationId 
                        ? {...c, lastMessage: receivedMessage.content, lastMessageTimestamp: receivedMessage.sentAt, 
                           // Crude unread increment if not sender, assuming mark-read happens on select
                           ...(receivedMessage.senderId !== currentUser.id && { 
                               unreadMessagesCountForUser1: c.user1Id === currentUser.id ? (c.unreadMessagesCountForUser1 || 0) +1 : c.unreadMessagesCountForUser1,
                               unreadMessagesCountForUser2: c.user2Id === currentUser.id ? (c.unreadMessagesCountForUser2 || 0) +1 : c.unreadMessagesCountForUser2,
                            })
                          } 
                        : c
                    ).sort((a,b) => parseISO(b.lastMessageTimestamp || 0) - parseISO(a.lastMessageTimestamp || 0)) // Re-sort
                    );
                } else {
                    // If message is for another conversation, update its unread count and last message
                    setConversations(prevConvos => prevConvos.map(c => 
                        c.id === receivedMessage.conversationId
                        ? {...c, lastMessage: receivedMessage.content, lastMessageTimestamp: receivedMessage.sentAt,
                           ...(receivedMessage.senderId !== currentUser.id && { 
                               unreadMessagesCountForUser1: c.user1Id === currentUser.id ? (c.unreadMessagesCountForUser1 || 0) +1 : c.unreadMessagesCountForUser1,
                               unreadMessagesCountForUser2: c.user2Id === currentUser.id ? (c.unreadMessagesCountForUser2 || 0) +1 : c.unreadMessagesCountForUser2,
                            })
                          }
                        : c
                    ).sort((a,b) => parseISO(b.lastMessageTimestamp || 0) - parseISO(a.lastMessageTimestamp || 0)) // Re-sort
                    );
                }
            });
            subscriptionsRef.current['general'] = generalSub;
        }, 
        (error) => {
            console.error('STOMP (Seller): Connection error: ' + error);
            toast.error("Real-time chat connection failed.");
        });
    }

    return () => {
      if (stompClientRef.current && stompClientRef.current.connected) {
        console.log("STOMP (Seller): Disconnecting...");
        Object.values(subscriptionsRef.current).forEach(sub => sub.unsubscribe());
        subscriptionsRef.current = {};
        stompClientRef.current.disconnect(() => { console.log('STOMP (Seller): Disconnected.'); });
        stompClientRef.current = null;
      }
    };
  }, [currentUser, isAuthenticated, userRole, selectedConversationId]);


  const handleSelectConversation = useCallback((conversationId) => {
    setSelectedConversationId(conversationId);
    // Mark as read is now handled in useEffect for fetching messages
  }, []);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversationId || !currentUser || isSending) return;

    setIsSending(true);
    const messagePayload = {
      conversationId: selectedConversationId,
      // senderId: currentUser.id, // Backend will use authenticated user as sender
      content: newMessage.trim(),
    };

    try {
      if (stompClientRef.current && stompClientRef.current.connected) {
        // Backend WebSocketChatController expects ChatMessageDto { conversationId, senderId, content, timestamp }
        // senderId and timestamp will be set by backend or WebSocketChatController
        const stompPayload = {
            conversationId: selectedConversationId,
            senderId: currentUser.id, // Required by backend ChatMessageDto
            content: newMessage.trim()
        };
        stompClientRef.current.send("/app/chat.sendMessage", {}, JSON.stringify(stompPayload));
      } else {
        // Fallback to REST API
        // Backend POST /api/chat/message expects ChatMessageRequestDto { conversationId, content }
        // senderId is derived from auth by backend
        const restPayload = { conversationId: selectedConversationId, content: newMessage.trim() };
        const response = await apiClient.post('/chat/message', restPayload);
        const sentMessage = response.data; // Expects MessageDto
        setSelectedConversationMessages(prevMessages => [...prevMessages, sentMessage]);
        loadConversations(selectedConversationId); // Refresh list for last message
      }
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error.response?.data || error.message);
      toast.error(error.response?.data?.message || "Failed to send message.");
    } finally {
      setIsSending(false);
    }
  };
  
  const handleBackToList = () => {
    setSelectedConversationId(null);
    setSelectedConversationMessages([]);
  };

  const selectedConversationDetails = useMemo(() => {
    return conversations.find(c => c.id === selectedConversationId);
  }, [conversations, selectedConversationId]);

  const otherParticipantNameInSelected = useMemo(() => {
    if (!selectedConversationDetails || !currentUser) return "Conversation";
    return currentUser.id === selectedConversationDetails.user1Id 
        ? selectedConversationDetails.user2Name 
        : selectedConversationDetails.user1Name;
  }, [selectedConversationDetails, currentUser]);

  if (isAuthLoading) {
    return (
      <div className="flex h-screen bg-gray-100">
        <Sidebar />
        <main className="flex-1 p-6 flex justify-center items-center">
          <p className="text-gray-500 animate-pulse text-lg">Loading Messages...</p>
        </main>
      </div>
    );
  }

  if (!isAuthenticated || userRole !== 'SELLER') {
     return (
      <div className="flex h-screen bg-gray-100">
        <Sidebar />
        <main className="flex-1 p-6 flex flex-col justify-center items-center text-center">
            <ChatBubbleLeftEllipsisIcon className="h-16 w-16 text-gray-300 mb-4" />
            <h2 className="text-xl font-semibold text-gray-700 mb-2">Access Denied</h2>
            <p className="text-gray-600">Please sign in as a Seller to view your messages.</p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar /> {/* Sidebar gets user info from AuthContext */}
      
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Conversation List Pane */}
        <div className={`
          ${selectedConversationId && 'hidden md:flex'} md:flex-col 
          w-full md:w-2/5 lg:w-1/3 xl:w-1/4 
          border-r border-gray-200 bg-white 
          flex flex-col
        `}>
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">Conversations</h2>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
            {isLoadingConversations && conversations.length === 0 && <p className="p-4 text-gray-400 text-center">Loading conversations...</p>}
            {!isLoadingConversations && conversations.length > 0 ? (
              conversations.map(convo => (
                <ConversationListItem 
                  key={convo.id} 
                  conversation={convo} 
                  onSelectConversation={handleSelectConversation}
                  isActive={selectedConversationId === convo.id}
                  currentUserId={currentUser?.id}
                />
              ))
            ) : (
              !isLoadingConversations && (
                <div className="p-4 text-center text-gray-500 mt-10">
                  <InboxIcon className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                  No conversations yet.
                </div>
              )
            )}
          </div>
        </div>

        {/* Message View Pane */}
        <div className={`
          ${!selectedConversationId && 'hidden md:flex'} md:flex-col 
          w-full md:w-3/5 lg:w-2/3 xl:w-3/4 
          bg-gray-50 flex flex-col
        `}>
          {selectedConversationId && selectedConversationDetails ? (
            <>
              <div className="p-3 sm:p-4 border-b border-gray-200 bg-white flex items-center space-x-3 shadow-sm">
                <button onClick={handleBackToList} className="md:hidden p-2 rounded-full hover:bg-gray-100 text-gray-600">
                  <ArrowLeftIcon className="h-5 w-5" />
                </button>
                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-500 text-sm overflow-hidden">
                  {otherParticipantNameInSelected?.charAt(0).toUpperCase() || '?'}
                </div>
                <div>
                    <h3 className="text-md font-semibold text-gray-800">{otherParticipantNameInSelected}</h3>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                {isLoadingMessages && <p className="text-center text-gray-500">Loading messages...</p>}
                {!isLoadingMessages && selectedConversationMessages.map(msg => (
                  <ChatMessageBubble 
                    key={msg.id || `msg-${Math.random()}`}
                    message={msg} 
                    currentUserId={currentUser.id}
                  />
                ))}
                <div ref={messagesEndRef} />
                 {isSending && <p className="text-xs text-gray-400 italic text-right my-1 pr-2">Sending...</p>}
              </div>

              <div className="p-3 sm:p-4 border-t border-gray-200 bg-white">
                <form onSubmit={handleSendMessage} className="flex items-center space-x-2 sm:space-x-3">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-2.5 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm"
                    disabled={isSending || isLoadingMessages}
                  />
                  <button 
                    type="submit" 
                    className="p-2.5 bg-purple-600 text-white rounded-full hover:bg-purple-700 transition-colors shadow focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-1 disabled:opacity-70"
                    disabled={!newMessage.trim() || isSending || isLoadingMessages}
                    aria-label="Send message"
                  >
                    <PaperAirplaneIcon className="h-5 w-5" />
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="hidden md:flex flex-1 flex-col justify-center items-center text-center p-8 text-gray-500">
              <ChatBubbleLeftEllipsisIcon className="h-20 w-20 text-gray-300 mb-4" />
              <h2 className="text-xl font-semibold">Select a conversation</h2>
              <p>Choose a conversation from the list to view messages.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
