import React from 'react';
import { format } from 'date-fns';

/**
 * A simple presentational component for displaying a single message.
 * This component is intended for use in contexts where a simple,
 * non-chat-bubble display is needed (e.g., a message preview list).
 *
 * Note: For the actual chat interface, the Buyer/Seller Messages pages use a
 * more complex "ChatMessageBubble" component defined locally.
 *
 * @param {object} props
 * @param {object} props.message - The message object.
 * @param {string} props.message.senderName - The name of the message sender.
 * @param {string} props.message.content - The text content of the message.
 * @param {string|Date} props.message.date - The date the message was sent.
 */
export default function MessageCard({ message }) {
  if (!message) {
    return null;
  }

  // Format the date for consistent display
  const formattedDate = message.date 
    ? format(new Date(message.date), 'Pp') // e.g., "06/07/2025, 6:43 PM"
    : 'No date';

  return (
    <div className="border border-gray-200 p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow mb-4 bg-white">
      <div className="flex justify-between items-center mb-2">
        <h4 className="font-semibold text-gray-800">{message.senderName || 'Unknown Sender'}</h4>
        <div className="text-xs text-gray-400">{formattedDate}</div>
      </div>
      <p className="text-sm text-gray-600">
        {message.content || 'No content.'}
      </p>
    </div>
  );
}