import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { chatApi, Conversation } from '../api/chat'
import { useAuthStore } from '../store/authStore'
import MobileLayout from '../components/MobileLayout'
import { MessageCircle } from 'lucide-react'

export default function ChatList() {
  const navigate = useNavigate()
  const { user } = useAuthStore()

  const { data, isLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => chatApi.getConversations(),
    refetchInterval: 10000,
  })

  const conversations = data?.conversations || []

  return (
    <MobileLayout title="Messages">
      {isLoading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}</div>
      ) : conversations.length === 0 ? (
        <div className="text-center py-16">
          <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">No conversations yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {conversations.map((conv: Conversation) => (
            <button key={conv.complaintId} onClick={() => navigate(`/chat/${conv.complaintId}`)}
              className="w-full bg-white rounded-xl border border-gray-200 p-3 flex items-center gap-3 active:bg-gray-50">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-blue-600">
                  {(user?.role === 'customer' ? conv.technicianName?.[0] : conv.customerName?.[0]) || '?'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {user?.role === 'customer' ? conv.technicianName : conv.customerName}
                  </p>
                  {conv.lastMessage && (
                    <span className="text-xs text-gray-400 flex-shrink-0">
                      {new Date(conv.lastMessage.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 truncate">{conv.complaintType}</p>
                {conv.lastMessage && (
                  <p className="text-xs text-gray-400 truncate">
                    {conv.lastMessage.messageType === 'voice' ? '🎤 Voice' : conv.lastMessage.content}
                  </p>
                )}
              </div>
              {conv.unreadCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center flex-shrink-0">
                  {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </MobileLayout>
  )
}
