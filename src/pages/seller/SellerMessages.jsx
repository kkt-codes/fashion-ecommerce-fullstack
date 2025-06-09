import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import Stomp from 'stompjs';
import SockJS from 'sockjs-client';
import { formatDistanceToNowStrict, parseISO } from 'date-fns';
import toast from 'react-hot-toast';
import { ChatBubbleLeftEllipsisIcon, PaperAirplaneIcon, ArrowLeftIcon, InboxIcon } from "@heroicons/react/24/outline";

import Sidebar from "../../components/Sidebar";
import { useAuth } from "../../context/AuthContext";
import { getMyConversations, getMessagesForConversation, markConversationAsRead } from "../../services/api";

const formatLastMessageTime = (isoTimestamp) => {
  if (!isoTimestamp) return '';
  return formatDistanceToNowStrict(parseISO(isoTimestamp), { addSuffix: true });
};

const formatMessageTimestamp = (isoTimestamp) => {
    if (!isoTimestamp) return '';
    const date = parseISO(isoTimestamp);
    return new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: 'numeric', hour12: true }).format(date);
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

  const selectedConvoIdRef = useRef(selectedConvoId);
  useEffect(() => {
    selectedConvoIdRef.current = selectedConvoId;
  }, [selectedConvoId]);

  const fetchConversations = useCallback(async () => {
    if (!currentUser) return;
    setIsLoadingConvos(true);
    try {
      const { data } = await getMyConversations();
      const sortedData = (data || []).sort((a, b) => 
          parseISO(b.lastMessageTimestamp || 0) - parseISO(a.lastMessageTimestamp || 0)
      );
      setConversations(sortedData);
    } catch (error) {
      toast.error("Could not load your conversations.");
    } finally {
      setIsLoadingConvos(false);
    }
  }, [currentUser]);
  
  const handleSelectConversation = useCallback(async (conversationId) => {
    if (isLoadingMessages) return;
    setSelectedConvoId(conversationId);
    setIsLoadingMessages(true);
    try {
        const { data } = await getMessagesForConversation(conversationId);
        setMessages(data || []);
        await markConversationAsRead(conversationId);
        setConversations(prev => prev.map(c => 
            c.id === conversationId ? { ...c, unreadMessageCount: 0 } : c
        ));
    } catch (error) {
        toast.error("Could not load messages for this conversation.");
        setMessages([]);
    } finally {
        setIsLoadingMessages(false);
    }
  }, [isLoadingMessages]);

  useEffect(() => {
    if (!currentUser || stompClientRef.current) return;

    const socket = new SockJS('http://localhost:8080/ws');
    const client = Stomp.over(socket);
    stompClientRef.current = client;

    const onMessageReceived = (message) => {
      const receivedMsg = JSON.parse(message.body);
      const isForCurrentConvo = receivedMsg.conversationId === selectedConvoIdRef.current;
      
      if (isForCurrentConvo) {
        setMessages(prevMessages => {
          if (prevMessages.some(msg => msg.id === receivedMsg.id)) {
            return prevMessages;
          }
          return [...prevMessages, receivedMsg];
        });
        if (receivedMsg.senderId !== currentUser.id) {
          markConversationAsRead(receivedMsg.conversationId);
        }
      }
      
      setConversations(prevConvos => {
          const convoExists = prevConvos.some(c => c.id === receivedMsg.conversationId);
          if (!convoExists) {
              fetchConversations();
              return prevConvos;
          }

          const updatedConvos = prevConvos.map(c => {
              if (c.id === receivedMsg.conversationId) {
                  return {
                      ...c,
                      lastMessageContent: receivedMsg.content,
                      lastMessageTimestamp: receivedMsg.sentAt,
                      lastMessageSenderId: receivedMsg.senderId,
                      unreadMessageCount: isForCurrentConvo ? 0 : (c.unreadMessageCount || 0) + 1,
                  };
              }
              return c;
          });
          
          return updatedConvos.sort((a, b) => 
            parseISO(b.lastMessageTimestamp || 0) - parseISO(a.lastMessageTimestamp || 0)
          );
      });
    };

    client.connect({}, 
      () => {
        console.log('STOMP (Seller): Connected');
        client.subscribe('/topic/messages', onMessageReceived);
      },
      (error) => console.error('STOMP (Seller): Connection error', error)
    );

    return () => {
      if (stompClientRef.current?.connected) {
        stompClientRef.current.disconnect(() => console.log('STOMP (Seller): Disconnected.'));
        stompClientRef.current = null;
      }
    };
  }, [currentUser, fetchConversations]);

  useEffect(() => {
    if (!isAuthLoading && currentUser) {
      fetchConversations();
    }
  }, [isAuthLoading, currentUser, fetchConversations]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    const trimmedMessage = newMessage.trim();
    if (!trimmedMessage || !stompClientRef.current?.connected || !selectedConvoId) return;

    const payload = {
      conversationId: selectedConvoId,
      senderId: currentUser.id,
      content: trimmedMessage,
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
        <div className={`w-full md:w-2/5 lg:w-1/3 xl:w-1/4 border-r bg-white flex flex-col ${selectedConvoId && 'hidden md:flex'}`}>
          <div className="p-4 border-b"><h2 className="text-xl font-semibold text-gray-800">Customer Messages</h2></div>
          <div className="flex-1 overflow-y-auto">
            {isLoadingConvos ? <p className="p-4 text-center text-gray-500">Loading...</p> :
              conversations.length > 0 ? conversations.map(convo => {
                const otherUserName = currentUser.id === convo.user1Id ? convo.user2Name : convo.user1Name;
                const isLastMessageFromMe = convo.lastMessageSenderId === currentUser.id;
                return (
                    <button key={convo.id} onClick={() => handleSelectConversation(convo.id)} className={`w-full text-left p-3 flex items-center gap-3 border-l-4 ${selectedConvoId === convo.id ? 'border-purple-500 bg-purple-50' : 'border-transparent hover:bg-gray-100'}`}>
                    <div className="relative h-12 w-12 rounded-full bg-gray-300 flex-shrink-0 flex items-center justify-center text-lg font-bold text-gray-600">
                        {otherUserName?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center">
                            <p className="font-semibold text-sm truncate">{otherUserName}</p>
                            {convo.lastMessageTimestamp && <p className="text-xs text-gray-400 flex-shrink-0">{formatLastMessageTime(convo.lastMessageTimestamp)}</p>}
                        </div>
                        <div className="flex justify-between items-center">
                            <p className={`text-xs truncate pr-2 ${convo.unreadMessageCount > 0 ? 'font-bold text-gray-800' : 'text-gray-500'}`}>
                                {isLastMessageFromMe ? `You: ${convo.lastMessageContent}` : convo.lastMessageContent || 'No messages yet.'}
                            </p>
                            {convo.unreadMessageCount > 0 && <span className="flex items-center justify-center bg-purple-600 text-white text-xs font-bold rounded-full h-5 w-5">{convo.unreadMessageCount}</span>}
                        </div>
                    </div>
                    </button>
                )
              }) : <div className="p-8 text-center text-gray-500"><InboxIcon className="h-12 w-12 mx-auto text-gray-300 mb-2" /><p>No conversations yet.</p></div>
            }
          </div>
        </div>

        <div className={`w-full md:w-3/5 lg:w-2/3 xl:w-3/4 flex flex-col bg-gray-200 ${!selectedConvoId && 'hidden md:flex'}`}>
          {selectedConvoId ? (
            <>
              <div className="p-3 bg-white border-b flex items-center gap-3 shadow-sm">
                <button onClick={() => setSelectedConvoId(null)} className="md:hidden p-2 rounded-full hover:bg-gray-100"><ArrowLeftIcon className="h-5 w-5" /></button>
                <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center font-semibold text-gray-600">{otherParticipantName?.charAt(0).toUpperCase()}</div>
                <h3 className="font-semibold text-gray-800">{otherParticipantName}</h3>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {isLoadingMessages ? <p className="text-center text-gray-500">Loading messages...</p> :
                  messages.map(msg => (
                    <div key={msg.id} className={`flex items-end gap-2 ${msg.senderId === currentUser.id ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] px-4 py-2 rounded-2xl ${msg.senderId === currentUser.id ? 'bg-purple-600 text-white rounded-br-none' : 'bg-white text-gray-800 rounded-bl-none shadow-sm'}`}>
                        <p className="text-sm">{msg.content}</p>
                        <p className="text-xs mt-1.5 text-right opacity-70">{formatMessageTimestamp(msg.sentAt)}</p>
                      </div>
                    </div>
                  ))}
                <div ref={messagesEndRef} />
              </div>
              <form onSubmit={handleSendMessage} className="p-4 bg-white border-t flex gap-3 items-center">
                <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Type your message..." className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500" />
                <button type="submit" className="p-3 bg-purple-600 text-white rounded-full shadow-md hover:bg-purple-700 disabled:opacity-50" disabled={!newMessage.trim()}><PaperAirplaneIcon className="h-5 w-5" /></button>
              </form>
            </>
          ) : (
            <div className="hidden md:flex flex-1 flex-col justify-center items-center text-center text-gray-500 p-8">
              <ChatBubbleLeftEllipsisIcon className="h-20 w-20 text-gray-300 mb-4" />
              <h2 className="text-xl font-semibold">Select a conversation</h2>
              <p>Choose a conversation from the list to view messages from your customers.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}