import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { chatApi } from '../api/chat'
import { useAuthStore } from '../store/authStore'
import Layout from '../components/Layout'
import { MessageCircle, ArrowRight } from 'lucide-react'

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
    <Layout title="Messages">
      <div className="max-w-2xl mx-auto">
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No conversations yet</h3>
            <p className="text-sm text-gray-500">
              {user?.role === 'customer'
                ? 'Chat will be available once a technician is assigned to your complaint.'
                : 'Chat will be available once complaints are assigned to you.'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {conversations.map((conv) => (
              <button
                key={conv.complaintId}
                onClick={() => navigate(`/chat/${conv.complaintId}`)}
                className="w-full bg-white rounded-xl border border-gray-200 p-4 hover:bg-gray-50 transition text-left flex items-center gap-4"
              >
                {/* Avatar */}
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-lg font-bold text-blue-600">
                    {(user?.role === 'customer'
                      ? conv.technicianName?.[0]
                      : conv.customerName?.[0]) || '?'}
                  </span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-sm font-semibold text-gray-900 truncate">
                      {user?.role === 'customer' ? conv.technicianName : conv.customerName}
                    </h4>
                    {conv.lastMessage && (
                      <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                        {new Date(conv.lastMessage.createdAt).toLocaleTimeString('en-IN', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 truncate mb-1">
                    {conv.complaintType} &middot; Block {conv.block}
                    <span className={`ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${
                      conv.status === 'CLOSED' ? 'bg-green-100 text-green-700' :
                      conv.status === 'IN PROGRESS' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {conv.status}
                    </span>
                  </p>
                  {conv.lastMessage && (
                    <p className="text-xs text-gray-400 truncate">
                      {conv.lastMessage.messageType === 'voice'
                        ? '🎤 Voice message'
                        : conv.lastMessage.content}
                    </p>
                  )}
                </div>

                {/* Unread badge + arrow */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {conv.unreadCount > 0 && (
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold">
                      {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                    </span>
                  )}
                  <ArrowRight className="w-4 h-4 text-gray-400" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}
