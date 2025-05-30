import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import Sidebar from "../../components/Sidebar";
import { useAuthContext } from "../../context/AuthContext";
import toast from 'react-hot-toast';
import {
  ChatBubbleLeftEllipsisIcon, PaperAirplaneIcon, ArrowLeftIcon,
  ArchiveBoxIcon, PlusCircleIcon, ChartBarIcon, InboxIcon, UserGroupIcon
} from "@heroicons/react/24/outline";
import { formatDistanceToNowStrict, parseISO, isToday, format } from 'date-fns';
// Removed mock data imports

const API_BASE_URL = 'http://localhost:8080/api'; 
// const WEBSOCKET_URL = 'http://localhost:8080/ws'; // For future WebSocket integration

const sellerLinks = [
  { label: "Dashboard", path: "/seller/dashboard", icon: ChartBarIcon },
  { label: "My Products", path: "/seller/products", icon: ArchiveBoxIcon },
  { label: "Add Product", path: "/seller/add-product", icon: PlusCircleIcon },
  { label: "Messages", path: "/seller/messages", icon: ChatBubbleLeftEllipsisIcon }
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
  const otherParticipantId = conversation.user1Id === currentUserId ? conversation.user2Id : conversation.user1Id;
  // For now, display ID. Fetching names requires more complex DTO or separate calls.
  const otherParticipantName = `User ${otherParticipantId.substring(0, 8)}... (Buyer)`; 
  
  // These fields (lastMessage, unreadCount) are assumed to be added client-side
  // or ideally would come from an enhanced backend DTO.
  const lastMessageText = conversation.lastMessage?.content || "No messages yet";
  const lastMessageTimestamp = conversation.lastMessage?.sentAt;
  const isUnread = conversation.unreadCount > 0;

  return (
    <button
      onClick={() => onSelectConversation(conversation.id, otherParticipantName, otherParticipantId)}
      className={`w-full text-left p-3 hover:bg-gray-100 rounded-lg transition-colors duration-150 flex items-start space-x-3
        ${isActive ? 'bg-blue-50 shadow-sm' : ''}
        ${isUnread ? 'font-semibold text-gray-800' : 'text-gray-600'}`}
    >
      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-500 text-sm">
        <UserGroupIcon className="h-5 w-5"/> {/* Generic icon */}
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
  // Displaying sender ID for now.
  const senderName = isCurrentUserSender ? "You (Seller)" : `Buyer (ID: ${message.senderId.substring(0,8)}...)`;

  return (
    <div className={`flex mb-3 ${isCurrentUserSender ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[70%] p-3 rounded-xl shadow-sm ${
        isCurrentUserSender 
          ? 'bg-green-500 text-white rounded-br-none' // Seller's messages in green
          : 'bg-gray-200 text-gray-800 rounded-bl-none' // Buyer's messages in gray
      }`}>
        {!isCurrentUserSender && (
          <p className="text-xs font-semibold mb-0.5 text-gray-600">{senderName}</p>
        )}
        <p className="text-sm whitespace-pre-wrap break-words">{message.encryptedContent}</p>
        <p className={`text-xs mt-1.5 opacity-80 text-right ${isCurrentUserSender ? 'text-green-100' : 'text-gray-500'}`}>
          {formatMessageTimestamp(message.sentAt)}
        </p>
      </div>
    </div>
  );
};

export default function SellerMessages() {
  const { currentUser, isAuthenticated, userRole, isLoading: isAuthLoading } = useAuthContext();
  const messagesEndRef = useRef(null);

  const [conversations, setConversations] = useState([]);
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [selectedConversationMessages, setSelectedConversationMessages] = useState([]);
  const [selectedConversationPartner, setSelectedConversationPartner] = useState({ name: '', id: '' });
  
  const [newMessage, setNewMessage] = useState("");
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [selectedConversationMessages]);

  const loadConversations = useCallback(async () => {
    if (!currentUser?.id || userRole !== 'Seller') {
      setConversations([]);
      setIsLoadingConversations(false);
      return;
    }
    setIsLoadingConversations(true);
    try {
      const response = await fetch(`${API_BASE_URL}/chat/user/${currentUser.id}/conversations`);
      if (!response.ok) throw new Error("Failed to load conversations.");
      let fetchedConversations = await response.json();

      // Client-side enhancement for last message and unread count
      // IDEAL: Backend DTO should provide this.
      fetchedConversations = await Promise.all(fetchedConversations.map(async (convo) => {
        const messagesResponse = await fetch(`${API_BASE_URL}/chat/conversation/${convo.id}/messages`);
        let lastMsg = null;
        let unread = 0;
        if(messagesResponse.ok) {
          const msgs = await messagesResponse.json();
          if (msgs.length > 0) {
            lastMsg = msgs[msgs.length - 1];
            unread = msgs.filter(m => m.senderId !== currentUser.id && !m.read).length;
          }
        }
        return {...convo, lastMessage: lastMsg, unreadCount: unread};
      }));
      
      fetchedConversations.sort((a, b) => {
        const dateA = a.lastMessage ? parseISO(a.lastMessage.sentAt) : new Date(0);
        const dateB = b.lastMessage ? parseISO(b.lastMessage.sentAt) : new Date(0);
        return dateB - dateA;
      });

      setConversations(fetchedConversations);
    } catch (error) {
      console.error("SellerMessages: Error loading conversations:", error);
      toast.error("Could not load your conversations.");
    } finally {
      setIsLoadingConversations(false);
    }
  }, [currentUser, userRole]);

  const fetchMessagesForConversation = useCallback(async (conversationId) => {
    if (!conversationId || !currentUser?.id) return;
    setIsLoadingMessages(true);
    try {
      const response = await fetch(`${API_BASE_URL}/chat/conversation/${conversationId}/messages`);
      if (!response.ok) throw new Error("Failed to load messages.");
      const messages = await response.json();
      setSelectedConversationMessages(messages.sort((a,b) => parseISO(a.sentAt) - parseISO(b.sentAt)));

      await fetch(`${API_BASE_URL}/chat/conversation/${conversationId}/mark-read/${currentUser.id}`, { method: 'POST' });
      setConversations(prev => prev.map(c => c.id === conversationId ? {...c, unreadCount: 0} : c));
    } catch (error) {
      console.error("SellerMessages: Error loading messages:", error);
      toast.error("Could not load messages for this conversation.");
    } finally {
      setIsLoadingMessages(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (!isAuthLoading && isAuthenticated && userRole === 'Seller') {
      loadConversations();
    }
  }, [isAuthLoading, isAuthenticated, userRole, loadConversations]);

  const handleSelectConversation = useCallback((conversationId, partnerName, partnerId) => {
    setSelectedConversationId(conversationId);
    setSelectedConversationPartner({ name: partnerName, id: partnerId });
    fetchMessagesForConversation(conversationId);
  }, [fetchMessagesForConversation]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversationId || !currentUser?.id || isSending) return;

    setIsSending(true);
    try {
      const response = await fetch(`${API_BASE_URL}/chat/message?conversationId=${selectedConversationId}&senderId=${currentUser.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: newMessage.trim(),
      });
      if (!response.ok) throw new Error("Failed to send message.");
      
      setNewMessage("");
      fetchMessagesForConversation(selectedConversationId); // Refresh messages
      // Consider more sophisticated update of conversations list (e.g., for last message preview)
      // For now, a full reload or relying on next poll/websocket for conversation list update.
      // Simple update to bring active convo to top (if not already sorted by backend by activity)
      // loadConversations(); // Could re-fetch all conversations to update last message and order
    } catch (error) {
      console.error("SellerMessages: Error sending message:", error);
      toast.error("Failed to send message.");
    } finally {
      setIsSending(false);
    }
  };
  
  const handleBackToList = () => {
    setSelectedConversationId(null);
    setSelectedConversationMessages([]);
    setSelectedConversationPartner({ name: '', id: '' });
  };
  
  const userName = currentUser?.firstname || "Seller";

  if (isAuthLoading) {
    return (
      <div className="flex h-screen bg-gray-100">
        <Sidebar links={sellerLinks} userRole="Seller" userName={userName} />
        <main className="flex-1 p-6 flex justify-center items-center">
          <p className="text-gray-500 animate-pulse text-lg">Loading Messages...</p>
        </main>
      </div>
    );
  }

  if (!isAuthenticated || userRole !== 'Seller') {
     return (
      <div className="flex h-screen bg-gray-100">
        <Sidebar links={sellerLinks} userRole="Seller" userName={userName} />
        <main className="flex-1 p-6 flex flex-col justify-center items-center text-center">
            <ChatBubbleLeftEllipsisIcon className="h-16 w-16 text-gray-300 mb-4" />
            <h2 className="text-xl font-semibold text-gray-700 mb-2">Access Denied</h2>
            <p className="text-gray-600">Please sign in as a Seller to view messages.</p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar links={sellerLinks} userRole="Seller" userName={userName} />
      
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Conversations List Panel */}
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
                  <p className="text-center text-gray-400 py-10">No messages in this conversation yet. Be the first to reply!</p>
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
                    placeholder="Type your reply..."
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
              <p>Choose a conversation from the list to view and reply to messages.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
