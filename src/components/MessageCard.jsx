// Single message item

export default function MessageCard({ message }) {
    return (
      <div className="border p-4 rounded-lg shadow hover:shadow-md transition mb-4">
        <h4 className="font-bold">{message.senderName}</h4>
        <p className="text-sm text-gray-600">{message.content}</p>
        <div className="text-xs text-right text-gray-400 mt-2">{message.date}</div>
      </div>
    );
  }
  