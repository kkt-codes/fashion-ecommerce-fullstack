import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import Sidebar from "../../components/Sidebar";
import { useAuthContext } from "../../context/AuthContext";
import toast from 'react-hot-toast';
import {
  ChatBubbleLeftEllipsisIcon, PaperAirplaneIcon, ArrowLeftIcon,
  UserCircleIcon, ListBulletIcon, ChartBarIcon, HeartIcon, InboxIcon, UserGroupIcon
} from "@heroicons/react/24/outline";
import { formatDistanceToNowStrict, parseISO, isToday, format } from 'date-fns';
import { useLocation, useNavigate } from 'react-router-dom';

// StompJS and SockJS for WebSocket (optional, for real-time updates)
// import { Client } from '@stomp/stompjs';
// import SockJS from 'sockjs-client';

const API_BASE_URL = 'http://localhost:8080/api'; 
// const WEBSOCKET_URL = 'http://localhost:8080/ws'; // WebSocket endpoint

const buyerLinks = [
  { label: "Dashboard", path: "/buyer/dashboard", icon: ChartBarIcon },
  { label: "My Orders", path: "/buyer/orders", icon: ListBulletIcon },
  { label: "Messages", path: "/buyer/messages", icon: ChatBubbleLeftEllipsisIcon },
  { label: "My Profile", path: "/buyer/profile", icon: UserCircleIcon },
  { label: "My Favorites", path: "/buyer/favorites", icon: HeartIcon },
];

// Helper to format timestamp
const formatMessageTimestamp = (isoString) => {
  if (!isoString) return '';
  const date = parseISO(isoString);
  if (isToday(date)) {
    return format(date, 'p'); // e.g., 2:30 PM
  }
  return format(date, 'MMM d, p'); // e.g., May 30, 2:30 PM
};


const ConversationListItem = ({ conversation, onSelectConversation, isActive, currentUserId }) => {
  // Backend ConversationDto: id, user1Id, user2Id, startedAt
  // We need to determine the 'other' participant.
  const otherParticipantId = conversation.user1Id === currentUserId ? conversation.user2Id : conversation.user1Id;
  // For now, we'll display the ID. Fetching names would require another API call or modified DTO.
  const otherParticipantName = `User ${otherParticipantId.substring(0, 8)}...`; 
  
  // lastMessageText, lastMessageTimestamp, isUnread, unreadMessagesCount are not directly in ConversationDto.
  // These would need to be derived or added to the DTO by the backend.
  // For now, we'll use placeholders or omit.
  const lastMessageText = conversation.lastMessage?.content || "No messages yet";
  const lastMessageTimestamp = conversation.lastMessage?.sentAt;
  const isUnread = conversation.unreadCount > 0; // Assuming backend adds unreadCount

  return (
    <button
      onClick={() => onSelectConversation(conversation.id, otherParticipantName, otherParticipantId)}
      className={`w-full text-left p-3 hover:bg-gray-100 rounded-lg transition-colors duration-150 flex items-start space-x-3
        ${isActive ? 'bg-blue-50 shadow-sm' : ''}
        ${isUnread ? 'font-semibold text-gray-800' : 'text-gray-600'}`}
    >
      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-500 text-sm">
        <UserGroupIcon className="h-5 w-5"/>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center">
          <p className={`truncate text-sm ${isUnread ? 'text-blue-600' : 'text-gray-800'}`}>
            {otherParticipantName}
          </p>
          {lastMessageTimestamp && (
            <p className={`text-xs whitespace-nowrap ${isUnread ? 'text-blue-500' : 'text-gray-400'}`}>
              {formatMessageTimestamp(lastMessageTimestamp)}
            </p>
          )}
        </div>
        <div className="flex justify-between items-center mt-1">
          <p className={`truncate text-xs ${isUnread ? 'text-gray-700' : 'text-gray-500'}`}>
            {lastMessageText}
          </p>
          {isUnread && conversation.unreadCount > 0 && (
            <span className="ml-2 px-2 py-0.5 text-xs font-bold text-white bg-red-500 rounded-full">
              {conversation.unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  );
};

const ChatMessageBubble = ({ message, currentUserId }) => {
  // Backend MessageDto: id, conversationId, senderId, encryptedContent, sentAt, read
  const isCurrentUserSender = message.senderId === currentUserId;
  // Again, senderName would require fetching user details or modifying DTO.
  const senderName = isCurrentUserSender ? "You" : `User ${message.senderId.substring(0,8)}...`;

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
        <p className="text-sm whitespace-pre-wrap break-words">{message.encryptedContent}</p> {/* Assuming content is decrypted or for display */}
        <p className={`text-xs mt-1.5 opacity-80 text-right ${isCurrentUserSender ? 'text-blue-100' : 'text-gray-500'}`}>
          {formatMessageTimestamp(message.sentAt)}
        </p>
      </div>
    </div>
  );
};


export default function BuyerMessages() {
  const { currentUser, isAuthenticated, userRole, isLoading: isAuthLoading } = useAuthContext();
  const location = useLocation();
  const navigate = useNavigate();
  const messagesEndRef = useRef(null); // For auto-scrolling

  const [conversations, setConversations] = useState([]);
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [selectedConversationMessages, setSelectedConversationMessages] = useState([]);
  const [selectedConversationPartner, setSelectedConversationPartner] = useState({ name: '', id: '' });
  
  const [newMessage, setNewMessage] = useState("");
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // const stompClientRef = useRef(null); // For WebSocket client

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [selectedConversationMessages]);


  // Fetch all conversations for the current buyer
  const loadConversations = useCallback(async (selectConvoId = null, productContext = null) => {
    if (!currentUser?.id || userRole !== 'Buyer') {
      setConversations([]);
      setIsLoadingConversations(false);
      return;
    }
    setIsLoadingConversations(true);
    try {
      const response = await fetch(`${API_BASE_URL}/chat/user/${currentUser.id}/conversations`);
      if (!response.ok) throw new Error("Failed to load conversations.");
      let fetchedConversations = await response.json(); // List<ConversationDto>
      
      // Enhance conversations with last message and unread count (client-side for now)
      // Ideally, backend DTO would include this.
      fetchedConversations = await Promise.all(fetchedConversations.map(async (convo) => {
        const messagesResponse = await fetch(`${API_BASE_URL}/chat/conversation/${convo.id}/messages`);
        let lastMsg = null;
        let unread = 0;
        if(messagesResponse.ok) {
          const msgs = await messagesResponse.json();
          if (msgs.length > 0) {
            lastMsg = msgs[msgs.length - 1]; // Assuming sorted by date
            // Calculate unread (simplified, backend should ideally provide this)
            unread = msgs.filter(m => m.senderId !== currentUser.id && !m.read).length;
          }
        }
        return {...convo, lastMessage: lastMsg, unreadCount: unread};
      }));
      
      // Sort by last message timestamp (descending)
      fetchedConversations.sort((a, b) => {
        const dateA = a.lastMessage ? parseISO(a.lastMessage.sentAt) : new Date(0);
        const dateB = b.lastMessage ? parseISO(b.lastMessage.sentAt) : new Date(0);
        return dateB - dateA;
      });

      setConversations(fetchedConversations);

      if (selectConvoId) {
        const convoToSelect = fetchedConversations.find(c => c.id === selectConvoId);
        if (convoToSelect) {
            const partnerId = convoToSelect.user1Id === currentUser.id ? convoToSelect.user2Id : convoToSelect.user1Id;
            handleSelectConversation(selectConvoId, `User ${partnerId.substring(0,8)}...`, partnerId);
             if (productContext?.name) {
                setNewMessage(`Regarding your product: ${productContext.name}\n\n`);
             }
        }
      }

    } catch (error) {
      console.error("BuyerMessages: Error loading conversations:", error);
      toast.error("Could not load your conversations.");
    } finally {
      setIsLoadingConversations(false);
    }
  }, [currentUser, userRole]);

  // Fetch messages for a selected conversation
  const fetchMessagesForConversation = useCallback(async (conversationId) => {
    if (!conversationId || !currentUser?.id) return;
    setIsLoadingMessages(true);
    try {
      const response = await fetch(`${API_BASE_URL}/chat/conversation/${conversationId}/messages`);
      if (!response.ok) throw new Error("Failed to load messages.");
      const messages = await response.json(); // List<MessageDto>
      setSelectedConversationMessages(messages.sort((a,b) => parseISO(a.sentAt) - parseISO(b.sentAt))); // Sort ascending

      // Mark messages as read
      await fetch(`${API_BASE_URL}/chat/conversation/${conversationId}/mark-read/${currentUser.id}`, { method: 'POST' });
      // Optimistically update unread count in conversation list or re-fetch conversations
      setConversations(prev => prev.map(c => c.id === conversationId ? {...c, unreadCount: 0} : c));

    } catch (error) {
      console.error("BuyerMessages: Error loading messages:", error);
      toast.error("Could not load messages for this conversation.");
    } finally {
      setIsLoadingMessages(false);
    }
  }, [currentUser]);

  // Handle initial conversation opening from navigation state (e.g., from ContactSellerButton)
  useEffect(() => {
    if (isAuthLoading || !currentUser?.id) return;

    const navigationState = location.state;
    if (navigationState && navigationState.openWithSellerId && currentUser?.id) {
      const { openWithSellerId, sellerName, productContext } = navigationState;
      // console.log("BuyerMessages: Attempting to start/get conversation with seller:", openWithSellerId);
      
      setIsLoadingConversations(true); // Show loading while starting/getting convo
      fetch(`${API_BASE_URL}/chat/start?user1Id=${currentUser.id}&user2Id=${openWithSellerId}`, { method: 'POST' })
        .then(response => {
          if (!response.ok) throw new Error("Failed to start or get conversation.");
          return response.json(); // Expects ConversationDto
        })
        .then(conversationData => {
          // console.log("BuyerMessages: Conversation started/retrieved:", conversationData);
          // Load all conversations, then select the target one and prefill message
          loadConversations(conversationData.id, productContext);
        })
        .catch(error => {
          console.error("BuyerMessages: Error starting/getting conversation:", error);
          toast.error("Could not initiate chat with seller.");
          loadConversations(); // Load conversations normally on error
        })
        .finally(() => {
            // Clear the state from location to prevent re-triggering
            navigate(location.pathname, { replace: true, state: {} });
        });
    } else {
      loadConversations(); // Normal load
    }
  }, [isAuthLoading, currentUser, location.state, navigate, loadConversations]);


  const handleSelectConversation = useCallback((conversationId, partnerName, partnerId) => {
    setSelectedConversationId(conversationId);
    setSelectedConversationPartner({ name: partnerName, id: partnerId});
    fetchMessagesForConversation(conversationId);
  }, [fetchMessagesForConversation]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversationId || !currentUser?.id || isSending) return;

    setIsSending(true);
    try {
      // Message content is sent as plain text in the request body for ChatController
      const response = await fetch(`${API_BASE_URL}/chat/message?conversationId=${selectedConversationId}&senderId=${currentUser.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' }, // As per ChatController
        body: newMessage.trim(),
      });
      if (!response.ok) throw new Error("Failed to send message.");
      
      // const sentMessage = await response.json(); // MessageDto
      // Optimistically add message or re-fetch
      setNewMessage("");
      fetchMessagesForConversation(selectedConversationId); // Re-fetch messages
      // Potentially update last message in conversations list (or re-fetch all conversations)
      // For simplicity, full re-fetch of messages for selected convo is done.
      // A more optimized approach would be to update conversations list locally or via WebSocket.
      const currentConvoIndex = conversations.findIndex(c => c.id === selectedConversationId);
      if (currentConvoIndex !== -1) {
          const updatedConvos = [...conversations];
          // To update last message, we'd need the new message content and timestamp
          // This is better handled by backend providing updated conversation list or WebSocket
          // For now, we just re-sort to bring active convo to top if backend doesn't sort by recent activity
          // Or call loadConversations() again after a short delay if necessary.
      }

    } catch (error) {
      console.error("BuyerMessages: Error sending message:", error);
      toast.error("Failed to send message.");
    } finally {
      setIsSending(false);
    }
  };
  
  const handleBackToList = () => {
    setSelectedConversationId(null);
    setSelectedConversationMessages([]);
    setSelectedConversationPartner({ name: '', id: '' });
    // Optionally refresh conversations list if unread counts might have changed
    // loadConversations(); 
  };

  // Placeholder for WebSocket setup (if implementing real-time)
  // useEffect(() => {
  //   if (isAuthenticated && currentUser?.id && !stompClientRef.current) {
  //     const socket = new SockJS(WEBSOCKET_URL);
  //     const client = new Client({
  //       webSocketFactory: () => socket,
  //       debug: (str) => console.log('STOMP: ' + str),
  //       reconnectDelay: 5000,
  //       onConnect: () => {
  //         console.log('STOMP: Connected');
  //         // Subscribe to general messages or specific conversation topics
  //         client.subscribe(`/topic/messages`, (message) => {
  //           const receivedMsg = JSON.parse(message.body); // Assuming ChatMessageDto
  //           console.log("WebSocket message received:", receivedMsg);
  //           // If this message belongs to the currently selected conversation, update messages
  //           if (receivedMsg.conversationId === selectedConversationId) {
  //             setSelectedConversationMessages(prev => [...prev, {
  //               id: Date.now(), // temp ID or use one from message
  //               conversationId: receivedMsg.conversationId,
  //               senderId: receivedMsg.senderId,
  //               encryptedContent: receivedMsg.content,
  //               sentAt: receivedMsg.timestamp || new Date().toISOString(),
  //               read: false,
  //             }].sort((a,b) => parseISO(a.sentAt) - parseISO(b.sentAt)));
  //           }
  //           // Update conversation list (last message, unread count)
  //           // This part can be complex and might require re-fetching conversations or smart updates.
  //           loadConversations(); // Simple re-fetch for now
  //         });
  //       },
  //       onStompError: (frame) => console.error('STOMP: Broker reported error: ' + frame.headers['message'], frame.body),
  //     });
  //     client.activate();
  //     stompClientRef.current = client;
  //   }
  //   return () => {
  //     if (stompClientRef.current?.active) {
  //       stompClientRef.current.deactivate();
  //       stompClientRef.current = null;
  //       console.log('STOMP: Disconnected');
  //     }
  //   };
  // }, [isAuthenticated, currentUser, selectedConversationId, loadConversations]);


  if (isAuthLoading) {
    return (
      <div className="flex h-screen bg-gray-100">
        <Sidebar links={buyerLinks} userRole="Buyer" userName={currentUser?.firstname || "User"} />
        <main className="flex-1 p-6 flex justify-center items-center">
          <p className="text-gray-500 animate-pulse text-lg">Loading Your Messages...</p>
        </main>
      </div>
    );
  }

  if (!isAuthenticated || userRole !== 'Buyer') {
     return (
      <div className="flex h-screen bg-gray-100">
        <Sidebar links={buyerLinks} userRole="Buyer" />
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
      <Sidebar links={buyerLinks} userRole="Buyer" userName={currentUser?.firstname || "User"} />
      
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Conversations List Panel */}
        <div className={`
          ${selectedConversationId && 'hidden md:flex'} md:flex-col 
          w-full md:w-2/5 lg:w-1/3 xl:w-1/4 
          border-r border-gray-200 bg-white 
          flex flex-col
        `}>
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">Messages</h2>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
            {isLoadingConversations ? (
              <p className="p-4 text-gray-400 text-center">Loading conversations...</p>
            ) : conversations.length > 0 ? (
              conversations.map(convo => (
                <ConversationListItem 
                  key={convo.id} 
                  conversation={convo} 
                  onSelectConversation={handleSelectConversation}
                  isActive={selectedConversationId === convo.id}
                  currentUserId={currentUser.id}
                />
              ))
            ) : (
              <div className="p-4 text-center text-gray-500">
                <InboxIcon className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                No conversations yet.
              </div>
            )}
          </div>
        </div>

        {/* Selected Conversation Panel */}
        <div className={`
          ${!selectedConversationId && 'hidden md:flex'} md:flex-col 
          w-full md:w-3/5 lg:w-2/3 xl:w-3/4 
          bg-gray-50 flex flex-col
        `}>
          {selectedConversationId ? (
            <>
              <div className="p-3 sm:p-4 border-b border-gray-200 bg-white flex items-center space-x-3 shadow-sm">
                <button onClick={handleBackToList} className="md:hidden p-2 rounded-full hover:bg-gray-100 text-gray-600">
                  <ArrowLeftIcon className="h-5 w-5" />
                </button>
                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-500 text-sm">
                  <UserGroupIcon className="h-5 w-5"/>
                </div>
                <div>
                    <h3 className="text-md font-semibold text-gray-800">{selectedConversationPartner.name || "Conversation"}</h3>
                    {/* <p className="text-xs text-green-500">Online</p> */}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                {isLoadingMessages ? (
                  <p className="text-center text-gray-400 py-10">Loading messages...</p>
                ) : selectedConversationMessages.length > 0 ? (
                  selectedConversationMessages.map(msg => (
                    <ChatMessageBubble 
                      key={msg.id} 
                      message={msg} 
                      currentUserId={currentUser.id}
                    />
                  ))
                ) : (
                  <p className="text-center text-gray-400 py-10">No messages in this conversation yet.</p>
                )}
                <div ref={messagesEndRef} />
                 {isSending && <p className="text-xs text-gray-400 italic text-center my-2">Sending...</p>}
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
              <p>Choose a conversation from the list to view messages.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
