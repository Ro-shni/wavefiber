import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { chatApi, ChatMessage } from '../api/chat'
import { complaintsApi } from '../api/complaints'
import { useAuthStore } from '../store/authStore'
import { getSocket, connectSocket } from '../lib/socket'
import VoiceRecorder from '../components/VoiceRecorder'
import toast from 'react-hot-toast'
import { ArrowLeft, Send, Mic, X } from 'lucide-react'

export default function ChatPage() {
  const { complaintId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const endRef = useRef<HTMLDivElement>(null)
  const [msg, setMsg] = useState('')
  const [sending, setSending] = useState(false)
  const [showVoice, setShowVoice] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [typing, setTyping] = useState<string | null>(null)
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { data: complaintData } = useQuery({
    queryKey: ['complaint', complaintId],
    queryFn: () => complaintsApi.getById(complaintId!),
    enabled: !!complaintId,
  })

  const { data: msgData } = useQuery({
    queryKey: ['chat-messages', complaintId],
    queryFn: () => chatApi.getMessages(complaintId!),
    enabled: !!complaintId,
  })

  useEffect(() => { if (msgData?.messages) setMessages(msgData.messages) }, [msgData])

  useEffect(() => {
    if (!complaintId) return
    connectSocket()
    const socket = getSocket()
    socket.emit('join-chat', complaintId)
    socket.on('new-message', (m: ChatMessage) => {
      setMessages(prev => prev.some(p => p._id === m._id) ? prev : [...prev, m])
    })
    socket.on('user-typing', ({ userName }: { userName: string }) => setTyping(userName))
    socket.on('user-stop-typing', () => setTyping(null))
    return () => { socket.emit('leave-chat', complaintId); socket.off('new-message'); socket.off('user-typing'); socket.off('user-stop-typing') }
  }, [complaintId])

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const handleSend = async () => {
    if (!msg.trim() || sending) return
    setSending(true)
    try {
      await chatApi.sendMessage(complaintId!, msg.trim())
      setMsg('')
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
    } catch { toast.error('Failed to send') }
    finally { setSending(false) }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
    const socket = getSocket()
    socket.emit('typing', { complaintId, userName: user?.name })
    if (typingTimeout.current) clearTimeout(typingTimeout.current)
    typingTimeout.current = setTimeout(() => socket.emit('stop-typing', { complaintId }), 1500)
  }

  const handleVoiceSend = async (blob: Blob, duration: number) => {
    try {
      await chatApi.sendVoiceMessage(complaintId!, blob, duration)
      setShowVoice(false)
      toast.success('Voice sent!')
    } catch { toast.error('Failed to send voice') }
  }

  const complaint = complaintData?.complaint
  const partnerName = user?.role === 'customer' ? complaint?.technicianName || 'Technician' : complaint?.customerName || 'Customer'

  const formatTime = (d: string) => new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 safe-area-top">
        <button onClick={() => navigate(-1)} className="text-gray-600"><ArrowLeft className="w-5 h-5" /></button>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">{partnerName}</p>
          <p className="text-xs text-gray-500 truncate">{complaint?.complaintType}</p>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
        {messages.map((m) => {
          const isOwn = m.senderId === user?.id
          return (
            <div key={m._id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-2xl px-3 py-2 ${isOwn ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-white border border-gray-200 rounded-bl-sm'}`}>
                {!isOwn && <p className={`text-xs font-medium mb-0.5 ${m.senderRole === 'technician' ? 'text-blue-600' : 'text-green-600'}`}>{m.senderName}</p>}
                {m.messageType === 'voice' && m.voiceUrl ? (
                  <audio controls preload="metadata" className="w-48 h-8" src={m.voiceUrl} />
                ) : (
                  <p className="text-sm whitespace-pre-wrap break-words">{m.content}</p>
                )}
                <p className={`text-xs mt-0.5 text-right ${isOwn ? 'text-blue-200' : 'text-gray-400'}`}>{formatTime(m.createdAt)}</p>
              </div>
            </div>
          )
        })}
        {typing && <div className="text-xs text-gray-400 italic px-2">{typing} is typing...</div>}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-200 px-3 py-2 safe-area-bottom">
        {showVoice ? (
          <div className="relative">
            <button onClick={() => setShowVoice(false)} className="absolute top-0 right-0 p-1 text-gray-400 z-10"><X className="w-4 h-4" /></button>
            <VoiceRecorder onRecordingComplete={handleVoiceSend} onRecordingCancelled={() => setShowVoice(false)} />
          </div>
        ) : (
          <div className="flex items-end gap-2">
            <button onClick={() => setShowVoice(true)} className="p-2 text-gray-500 active:text-red-500"><Mic className="w-5 h-5" /></button>
            <input value={msg} onChange={(e) => setMsg(e.target.value)} onKeyDown={handleKeyDown}
              placeholder="Message..." className="flex-1 px-4 py-2 border border-gray-300 rounded-full text-sm focus:ring-2 focus:ring-blue-500" />
            <button onClick={handleSend} disabled={!msg.trim() || sending}
              className="p-2 bg-blue-600 text-white rounded-full active:bg-blue-700 disabled:opacity-50"><Send className="w-5 h-5" /></button>
          </div>
        )}
      </div>
    </div>
  )
}
