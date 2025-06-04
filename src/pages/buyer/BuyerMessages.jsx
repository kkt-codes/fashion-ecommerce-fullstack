import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import Sidebar from "../../components/Sidebar";
import { useAuthContext } from "../../context/AuthContext";
import apiClient from "../../services/api";
import toast from 'react-hot-toast';
import {
  ChatBubbleLeftEllipsisIcon, PaperAirplaneIcon, ArrowLeftIcon,
  InboxIcon // For empty states
} from "@heroicons/react/24/outline";
import { formatDistanceToNowStrict, parseISO, isToday, format } from 'date-fns';
import { useLocation, useNavigate } from 'react-router-dom';
import Stomp from 'stompjs'; // For WebSocket STOMP client
import SockJS from 'sockjs-client'; // For SockJS WebSocket fallback

// Helper to format timestamp
const formatMessageTimestamp = (isoTimestamp) => {
  if (!isoTimestamp) return '';
  const date = parseISO(isoTimestamp);
  if (isToday(date)) {
    return format(date, 'p'); // e.g., 2:30 PM
  }
  return format(date, 'MMM d, p'); // e.g., Jun 3, 2:30 PM
};


const ConversationListItem = ({ conversation, onSelectConversation, isActive, currentUserId }) => {
  // Backend ConversationDto: id, user1Id, user2Id, user1Name, user2Name, lastMessage, lastMessageTimestamp, unreadMessagesCountForUser1, unreadMessagesCountForUser2
  const otherParticipant = currentUser?.id === conversation.user1Id 
    ? { id: conversation.user2Id, name: conversation.user2Name || "User " + conversation.user2Id?.slice(-4) } 
    : { id: conversation.user1Id, name: conversation.user1Name || "User " + conversation.user1Id?.slice(-4) };
  
  const lastMessageText = conversation.lastMessage || "No messages yet...";
  const lastMessageTimestamp = conversation.lastMessageTimestamp;
  
  // Determine unread status based on who the current user is in the conversation
  let unreadMessagesCount = 0;
  if (currentUser?.id === conversation.user1Id) {
    unreadMessagesCount = conversation.unreadMessagesCountForUser1 || 0;
  } else if (currentUser?.id === conversation.user2Id) {
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
        {/* Basic initial for avatar fallback */}
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

const ChatMessageBubble = ({ message, currentUserId }) => {
  // Backend MessageDto: id, conversationId, senderId, senderName, content (was encryptedContent), sentAt, isRead
  const isCurrentUserSender = message.senderId === currentUserId;
  const senderName = message.senderName || 'Unknown';

  return (
    <div className={`flex mb-3 ${isCurrentUserSender ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[70%] p-3 rounded-xl shadow-sm ${
        isCurrentUserSender 
          ? 'bg-blue-500 text-white rounded-br-none' 
          : 'bg-gray-200 text-gray-800 rounded-bl-none'
      }`}>
        {!isCurrentUserSender && (
          <p className="text-xs font-semibold mb-0.5 text-gray-600">{senderName}</p>
        )}
        <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p> {/* Use content */}
        <p className={`text-xs mt-1.5 opacity-80 text-right ${isCurrentUserSender ? 'text-blue-100' : 'text-gray-500'}`}>
          {message.sentAt ? formatMessageTimestamp(message.sentAt) : 'sending...'}
        </p>
      </div>
    </div>
  );
};


export default function BuyerMessagesPage() { // Renamed for clarity
  const { currentUser, isAuthenticated, userRole, isLoading: isAuthLoading } = useAuthContext();
  const location = useLocation();
  const navigate = useNavigate();

  const [conversations, setConversations] = useState([]);
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [selectedConversationMessages, setSelectedConversationMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const stompClientRef = useRef(null);
  const subscriptionsRef = useRef({}); // To store STOMP subscriptions
  const messagesEndRef = useRef(null); // To scroll to bottom of messages

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [selectedConversationMessages]);


  const loadConversations = useCallback(async (selectConvId = null) => {
    if (!currentUser || userRole !== 'BUYER') {
      setConversations([]);
      setIsLoadingConversations(false);
      return;
    }
    setIsLoadingConversations(true);
    try {
      // Backend: GET /api/chat/user/me/conversations or /api/chat/user/{userId}/conversations
      const response = await apiClient.get(`/chat/user/${currentUser.id}/conversations`);
      const fetchedConversations = response.data || []; // Expects List<ConversationDto>
      setConversations(fetchedConversations);

      if (selectConvId && fetchedConversations.some(c => c.id === selectConvId)) {
        setSelectedConversationId(selectConvId);
      } else if (fetchedConversations.length > 0 && !selectedConversationId) {
        // Optionally auto-select the first conversation if none is selected
        // setSelectedConversationId(fetchedConversations[0].id);
      }

    } catch (error) {
      console.error("Error fetching conversations:", error.response?.data || error.message);
      toast.error("Could not load your conversations.");
    } finally {
      setIsLoadingConversations(false);
    }
  }, [currentUser, userRole, selectedConversationId]); // Added selectedConversationId

  // Effect to handle initial conversation opening from navigation state (e.g., from ContactSellerButton)
  useEffect(() => {
    if (isAuthLoading || !currentUser) return;

    const navigationState = location.state;

    if (navigationState && navigationState.openWithSellerId) {
      const { openWithSellerId, productContext } = navigationState;
      console.log("BuyerMessages: Attempting to start/get conversation with seller:", openWithSellerId);
      
      const startChat = async () => {
        setIsLoadingConversations(true);
        try {
          // Backend: POST /api/chat/start?user1Id={buyerId}&user2Id={sellerId}
          const response = await apiClient.post(`/chat/start?user1Id=${currentUser.id}&user2Id=${openWithSellerId}`);
          const conversation = response.data; // Expects ConversationDto
          if (conversation && conversation.id) {
            await loadConversations(conversation.id); // Load all conversations and select this one
            if (productContext?.name) {
              setNewMessage(`Regarding your product: ${productContext.name}\n\n`);
            }
          } else {
            toast.error("Could not start or find the chat.");
          }
        } catch (error) {
          console.error("Error starting chat:", error.response?.data || error.message);
          toast.error(error.response?.data?.message || "Failed to initiate chat.");
          loadConversations(); // Load existing conversations even if start fails
        } finally {
          setIsLoadingConversations(false);
          // Clear the state from location to prevent re-triggering
          navigate(location.pathname, { replace: true, state: {} });
        }
      };
      startChat();
    } else {
      loadConversations(); // Normal load if no specific conversation is to be opened
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthLoading, currentUser, location.state, navigate]); // loadConversations is stable

  // Effect to fetch messages when a conversation is selected
  useEffect(() => {
    if (selectedConversationId && currentUser) {
      const fetchMessages = async () => {
        setIsLoadingMessages(true);
        try {
          // Backend: GET /api/chat/conversation/{conversationId}/messages
          const response = await apiClient.get(`/chat/conversation/${selectedConversationId}/messages`);
          setSelectedConversationMessages(response.data || []); // Expects List<MessageDto>
          
          // Mark messages as read (optional, could be a separate action)
          // await apiClient.post(`/chat/conversation/${selectedConversationId}/mark-read/${currentUser.id}`);
          // loadConversations(); // Refresh conversation list for unread counts
        } catch (error) {
          console.error(`Error fetching messages for conversation ${selectedConversationId}:`, error.response?.data || error.message);
          toast.error("Could not load messages for this conversation.");
        } finally {
          setIsLoadingMessages(false);
        }
      };
      fetchMessages();
    } else {
      setSelectedConversationMessages([]); // Clear messages if no conversation selected
    }
  }, [selectedConversationId, currentUser, loadConversations]);


  // WebSocket/STOMP Setup
  useEffect(() => {
    if (!currentUser || !isAuthenticated) {
      if (stompClientRef.current && stompClientRef.current.connected) {
        stompClientRef.current.disconnect(() => console.log("STOMP: Disconnected due to user logout/auth change."));
        stompClientRef.current = null;
        subscriptionsRef.current = {};
      }
      return;
    }

    const token = localStorage.getItem('appAuthToken'); // Token for WebSocket connection

    // Ensure previous client is disconnected before creating a new one
    if (stompClientRef.current && stompClientRef.current.connected) {
        console.log("STOMP: Already connected or attempting to reconnect, skipping new connection setup for now.");
        // return; // Or disconnect and reconnect:
        // stompClientRef.current.disconnect(() => { /* then setup new connection */ });
    }
    
    // Only proceed if not already connected (or after explicit disconnect)
    if (!stompClientRef.current || !stompClientRef.current.connected) {
        const socket = new SockJS('http://localhost:8080/ws'); // Your backend WebSocket endpoint
        const stompClient = Stomp.over(socket);
        stompClientRef.current = stompClient;

        // STOMP Connect Headers (can include JWT for STOMP-level auth if backend configured for it)
        const connectHeaders = {
            // 'Authorization': `Bearer ${token}` // If your WebSocketConfig/ChannelInterceptor handles this
        };

        stompClient.connect(connectHeaders, 
            (frame) => { // On Connect
                console.log('STOMP: Connected: ' + frame);
                
                // Subscribe to a general topic for now, as per backend's current broadcast
                // Ideally, subscribe to user-specific or conversation-specific topics
                const generalSub = stompClient.subscribe('/topic/messages', (message) => {
                    const receivedMessage = JSON.parse(message.body); // ChatMessageDto from backend
                    console.log("STOMP: Received general message:", receivedMessage);
                    // If this message belongs to the currently selected conversation, add it
                    if (receivedMessage.conversationId === selectedConversationId) {
                        setSelectedConversationMessages(prevMessages => [...prevMessages, receivedMessage]);
                        // Also update conversation list with last message preview (more complex)
                        // loadConversations(); // This might be too heavy, better to update specific convo
                        setConversations(prevConvos => prevConvos.map(c => 
                            c.id === receivedMessage.conversationId 
                            ? {...c, lastMessage: receivedMessage.content, lastMessageTimestamp: receivedMessage.sentAt } 
                            : c
                        ));

                    }
                });
                subscriptionsRef.current['general'] = generalSub;

                // Example for user-specific queue (if backend supports it)
                // const userQueueSub = stompClient.subscribe(`/user/${currentUser.id}/queue/private-messages`, (message) => { ... });
                // subscriptionsRef.current['userQueue'] = userQueueSub;

            }, 
            (error) => { // On Error
                console.error('STOMP: Connection error: ' + error);
                toast.error("Real-time chat connection failed.");
                 // Implement reconnection logic if desired
            }
        );
        // Optional: Configure STOMP client (heartbeat, debug)
        // stompClient.debug = (str) => { console.log("STOMP_DEBUG:", str); };
    }

    return () => { // Cleanup on component unmount or user change
      if (stompClientRef.current && stompClientRef.current.connected) {
        console.log("STOMP: Disconnecting on component unmount/user change...");
        // Unsubscribe from all known subscriptions
        Object.values(subscriptionsRef.current).forEach(sub => sub.unsubscribe());
        subscriptionsRef.current = {};
        stompClientRef.current.disconnect(() => {
          console.log('STOMP: Disconnected.');
        });
        stompClientRef.current = null;
      }
    };
  }, [currentUser, isAuthenticated, selectedConversationId]); // Re-run if user or selectedConversationId changes for subscriptions


  const handleSelectConversation = useCallback((conversationId) => {
    setSelectedConversationId(conversationId);
    // Optionally mark messages as read on the backend when a conversation is selected
    // apiClient.post(`/chat/conversation/${conversationId}/mark-read/${currentUser.id}`).catch(e => console.error("Failed to mark as read", e));
  }, [currentUser]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversationId || !currentUser || isSending) return;

    setIsSending(true);
    const messagePayload = {
      conversationId: selectedConversationId,
      senderId: currentUser.id,
      content: newMessage.trim(), // Assuming backend expects 'content'
      // timestamp will be set by backend
    };

    try {
      // Option 1: Send via STOMP WebSocket
      if (stompClientRef.current && stompClientRef.current.connected) {
        stompClientRef.current.send("/app/chat.sendMessage", {}, JSON.stringify(messagePayload));
        // Optimistically add to UI, or wait for broadcast.
        // If waiting for broadcast, ensure sentAt is handled correctly for local display.
        // For now, we rely on the broadcast to update selectedConversationMessages.
        // To make it appear instantly:
        // const optimisticMessage = { ...messagePayload, sentAt: new Date().toISOString(), senderName: currentUser.firstName, id: Date.now() }; // temp id
        // setSelectedConversationMessages(prev => [...prev, optimisticMessage]);

        console.log("STOMP: Sent message via WebSocket", messagePayload);
      } else {
        // Option 2: Fallback to REST API if WebSocket not connected (or as primary if no WS)
        // Backend: POST /api/chat/message expects conversationId, senderId, encryptedContent (use content)
        const response = await apiClient.post('/chat/message', messagePayload);
        const sentMessage = response.data; // Expects MessageDto
        setSelectedConversationMessages(prevMessages => [...prevMessages, sentMessage]);
        // Refresh conversation list to update last message preview
        loadConversations(selectedConversationId);
        console.log("REST: Sent message via API", sentMessage);
      }
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error.response?.data || error.message);
      toast.error(error.response?.data?.message || "Failed to send message.");
      // If optimistic update was done, might need to revert it here.
    } finally {
      setIsSending(false);
    }
  };
  
  const handleBackToList = () => {
    setSelectedConversationId(null);
    setSelectedConversationMessages([]);
    // loadConversations(); // Optionally refresh list when going back
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


  if (isAuthLoading) { // Overall auth loading
    return (
      <div className="flex h-screen bg-gray-100">
        <Sidebar />
        <main className="flex-1 p-6 flex justify-center items-center">
          <p className="text-gray-500 animate-pulse text-lg">Loading Messages...</p>
        </main>
      </div>
    );
  }

  if (!isAuthenticated || userRole !== 'BUYER') {
     return (
      <div className="flex h-screen bg-gray-100">
        <Sidebar />
        <main className="flex-1 p-6 flex flex-col justify-center items-center text-center">
            <ChatBubbleLeftEllipsisIcon className="h-16 w-16 text-gray-300 mb-4" />
            <h2 className="text-xl font-semibold text-gray-700 mb-2">Access Denied</h2>
            <p className="text-gray-600">Please sign in as a Buyer to view your messages.</p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar />
      
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Conversation List Pane */}
        <div className={`
          ${selectedConversationId && 'hidden md:flex'} md:flex-col 
          w-full md:w-2/5 lg:w-1/3 xl:w-1/4 
          border-r border-gray-200 bg-white 
          flex flex-col
        `}>
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">Messages</h2>
            {/* Add search/filter for conversations if needed */}
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
                    {/* Could add online status here if available */}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                {isLoadingMessages && <p className="text-center text-gray-500">Loading messages...</p>}
                {!isLoadingMessages && selectedConversationMessages.map(msg => (
                  <ChatMessageBubble 
                    key={msg.id || `msg-${Math.random()}`} // Use msg.id from backend
                    message={msg} 
                    currentUserId={currentUser.id}
                  />
                ))}
                <div ref={messagesEndRef} /> {/* For scrolling to bottom */}
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
                    className="p-2.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors shadow focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 disabled:opacity-70"
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
              <p>Choose a conversation from the list to view messages or start a new one by contacting a seller from a product page.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
