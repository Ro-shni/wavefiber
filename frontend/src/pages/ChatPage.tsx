import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { chatApi, ChatMessage } from '../api/chat'
import { complaintsApi } from '../api/complaints'
import { useAuthStore } from '../store/authStore'
import { getSocket, connectSocket } from '../lib/socket'
import VoiceRecorder from '../components/VoiceRecorder'
import Layout from '../components/Layout'
import toast from 'react-hot-toast'
import { ArrowLeft, Send, Mic, X } from 'lucide-react'

export default function ChatPage() {
  const { complaintId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [typingUser, setTypingUser] = useState<string | null>(null)
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Fetch complaint details for header
  const { data: complaintData } = useQuery({
    queryKey: ['complaint', complaintId],
    queryFn: () => complaintsApi.getById(complaintId!),
    enabled: !!complaintId,
  })

  // Fetch initial messages
  const { data: messagesData } = useQuery({
    queryKey: ['chat-messages', complaintId],
    queryFn: () => chatApi.getMessages(complaintId!),
    enabled: !!complaintId,
  })

  // Set messages from query
  useEffect(() => {
    if (messagesData?.messages) {
      setMessages(messagesData.messages)
    }
  }, [messagesData])

  // Socket.IO setup
  useEffect(() => {
    if (!complaintId) return

    connectSocket()
    const socket = getSocket()

    socket.emit('join-chat', complaintId)

    socket.on('new-message', (message: ChatMessage) => {
      setMessages(prev => {
        // Avoid duplicate messages
        if (prev.some(m => m._id === message._id)) return prev
        return [...prev, message]
      })
    })

    socket.on('user-typing', ({ userName }: { userName: string }) => {
      setTypingUser(userName)
    })

    socket.on('user-stop-typing', () => {
      setTypingUser(null)
    })

    return () => {
      socket.emit('leave-chat', complaintId)
      socket.off('new-message')
      socket.off('user-typing')
      socket.off('user-stop-typing')
    }
  }, [complaintId])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = async () => {
    if (!newMessage.trim() || sending) return

    setSending(true)
    try {
      await chatApi.sendMessage(complaintId!, newMessage.trim())
      setNewMessage('')
      // Invalidate conversations to update unread counts
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
    } catch {
      toast.error('Failed to send message')
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }

    // Typing indicator
    const socket = getSocket()
    socket.emit('typing', { complaintId, userName: user?.name })
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('stop-typing', { complaintId })
    }, 1500)
  }

  const handleSendVoice = async (blob: Blob, duration: number) => {
    try {
      await chatApi.sendVoiceMessage(complaintId!, blob, duration)
      setShowVoiceRecorder(false)
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
      toast.success('Voice message sent!')
    } catch {
      toast.error('Failed to send voice message')
    }
  }

  const complaint = complaintData?.complaint
  const chatPartnerName = user?.role === 'customer'
    ? complaint?.technicianName || 'Technician'
    : complaint?.customerName || 'Customer'

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    const today = new Date()
    if (d.toDateString() === today.toDateString()) return 'Today'
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  // Group messages by date
  const groupedMessages: { date: string; messages: ChatMessage[] }[] = []
  let currentDate = ''
  for (const msg of messages) {
    const date = formatDate(msg.createdAt)
    if (date !== currentDate) {
      currentDate = date
      groupedMessages.push({ date, messages: [msg] })
    } else {
      groupedMessages[groupedMessages.length - 1].messages.push(msg)
    }
  }

  return (
    <Layout title="Chat">
      <div className="flex flex-col h-[calc(100vh-8rem)] max-w-3xl mx-auto">
        {/* Chat Header */}
        <div className="bg-white rounded-t-xl border border-gray-200 px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-gray-900 truncate">
              {chatPartnerName}
            </h3>
            <p className="text-xs text-gray-500 truncate">
              {complaint?.complaintType} &middot; Block {complaint?.block}
            </p>
          </div>
          <button
            onClick={() => navigate(`/complaint/${complaintId}`)}
            className="text-xs text-blue-600 hover:underline whitespace-nowrap"
          >
            View Complaint
          </button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto bg-gray-50 border-x border-gray-200 px-4 py-3 space-y-4">
          {groupedMessages.map((group) => (
            <div key={group.date}>
              {/* Date separator */}
              <div className="flex items-center justify-center my-3">
                <span className="px-3 py-1 bg-white border border-gray-200 rounded-full text-xs text-gray-500 shadow-sm">
                  {group.date}
                </span>
              </div>

              {group.messages.map((msg) => {
                const isOwn = msg.senderId === user?.id
                return (
                  <div
                    key={msg._id}
                    className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-2`}
                  >
                    <div
                      className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                        isOwn
                          ? 'bg-blue-600 text-white rounded-br-md'
                          : 'bg-white text-gray-900 border border-gray-200 rounded-bl-md'
                      }`}
                    >
                      {!isOwn && (
                        <p className={`text-xs font-medium mb-1 ${
                          msg.senderRole === 'technician' ? 'text-blue-600' : 'text-green-600'
                        }`}>
                          {msg.senderName}
                        </p>
                      )}

                      {msg.messageType === 'voice' && msg.voiceUrl ? (
                        <div className="min-w-[200px]">
                          <audio controls preload="metadata" className="w-full h-8" src={msg.voiceUrl} />
                          {(msg.voiceDuration ?? 0) > 0 && (
                            <p className={`text-xs mt-1 ${isOwn ? 'text-blue-200' : 'text-gray-400'}`}>
                              {Math.floor((msg.voiceDuration ?? 0) / 60)}:{((msg.voiceDuration ?? 0) % 60).toString().padStart(2, '0')}
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                      )}

                      <p className={`text-xs mt-1 text-right ${
                        isOwn ? 'text-blue-200' : 'text-gray-400'
                      }`}>
                        {formatTime(msg.createdAt)}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          ))}

          {/* Typing indicator */}
          {typingUser && (
            <div className="flex justify-start mb-2">
              <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-md px-4 py-2">
                <p className="text-xs text-gray-500 italic">{typingUser} is typing...</p>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="bg-white rounded-b-xl border border-gray-200 border-t-0 px-4 py-3">
          {showVoiceRecorder ? (
            <div className="relative">
              <button
                onClick={() => setShowVoiceRecorder(false)}
                className="absolute top-0 right-0 text-gray-400 hover:text-gray-600 z-10"
              >
                <X className="w-4 h-4" />
              </button>
              <VoiceRecorder
                onRecordingComplete={handleSendVoice}
                onRecordingCancelled={() => setShowVoiceRecorder(false)}
              />
            </div>
          ) : (
            <div className="flex items-end gap-2">
              <button
                onClick={() => setShowVoiceRecorder(true)}
                className="flex-shrink-0 p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-full transition"
                title="Send voice message"
              >
                <Mic className="w-5 h-5" />
              </button>
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message..."
                rows={1}
                className="flex-1 resize-none px-4 py-2 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm max-h-24"
              />
              <button
                onClick={handleSendMessage}
                disabled={!newMessage.trim() || sending}
                className="flex-shrink-0 p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
