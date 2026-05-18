import { useRef, useState } from 'react'
import { Mic, Square, Play, X } from 'lucide-react'
import toast from 'react-hot-toast'

interface VoiceRecorderProps {
  onRecordingComplete: (blob: Blob, duration: number) => void
  onRecordingCancelled?: () => void
  compact?: boolean
}

export default function VoiceRecorder({ onRecordingComplete, onRecordingCancelled, compact }: VoiceRecorderProps) {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [duration, setDuration] = useState(0)
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const getSupportedMimeType = (): string => {
    const types = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4']
    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) return type
    }
    return ''
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, sampleRate: 44100 }
      })
      const mimeType = getSupportedMimeType()
      const options: MediaRecorderOptions = mimeType ? { mimeType } : {}
      const mediaRecorder = new MediaRecorder(stream, options)
      const chunks: BlobPart[] = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data)
      }
      mediaRecorder.onstop = () => {
        const mime = mediaRecorder.mimeType || 'audio/webm'
        setRecordedBlob(new Blob(chunks, { type: mime }))
        stream.getTracks().forEach(t => t.stop())
      }

      mediaRecorder.start(250)
      mediaRecorderRef.current = mediaRecorder
      setIsRecording(true)
      setDuration(0)
      timerRef.current = setInterval(() => setDuration(p => p + 1), 1000)
    } catch {
      toast.error('Microphone access denied')
    }
  }

  const stopRecording = () => {
    mediaRecorderRef.current?.stop()
    setIsRecording(false)
    if (timerRef.current) clearInterval(timerRef.current)
  }

  const cancelRecording = () => {
    stopRecording()
    setRecordedBlob(null)
    setDuration(0)
    onRecordingCancelled?.()
  }

  const submitRecording = () => {
    if (recordedBlob && duration > 0) {
      onRecordingComplete(recordedBlob, duration)
      setRecordedBlob(null)
      setDuration(0)
    }
  }

  const fmt = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`
  const playbackUrl = recordedBlob ? URL.createObjectURL(recordedBlob) : undefined

  if (compact && !isRecording && !recordedBlob) {
    return (
      <button onClick={startRecording} className="p-3 bg-red-50 rounded-full text-red-600 active:bg-red-100">
        <Mic className="w-6 h-6" />
      </button>
    )
  }

  return (
    <div className="bg-gray-50 rounded-xl p-3 border border-gray-200">
      {!recordedBlob ? (
        <div className="flex items-center gap-3">
          {!isRecording ? (
            <button onClick={startRecording} className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium active:bg-red-700">
              <Mic className="w-4 h-4" /> Record
            </button>
          ) : (
            <>
              <div className="flex items-center gap-2 flex-1">
                <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse" />
                <span className="text-sm font-mono text-gray-700">{fmt(duration)}</span>
              </div>
              <button onClick={stopRecording} className="flex items-center gap-1 px-3 py-2 bg-gray-700 text-white rounded-lg text-sm active:bg-gray-800">
                <Square className="w-4 h-4" /> Stop
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <Play className="w-4 h-4" /> Recording: {fmt(duration)}
          </div>
          <audio ref={audioRef} src={playbackUrl} onEnded={() => setIsPlaying(false)} className="hidden" />
          <div className="flex gap-2">
            <button onClick={() => { isPlaying ? audioRef.current?.pause() : audioRef.current?.play(); setIsPlaying(!isPlaying) }}
              className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg active:bg-blue-700">
              {isPlaying ? 'Pause' : 'Play'}
            </button>
            <button onClick={submitRecording} className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg active:bg-green-700">
              Send
            </button>
            <button onClick={cancelRecording} className="px-3 py-1.5 text-sm bg-gray-200 text-gray-700 rounded-lg active:bg-gray-300 flex items-center gap-1">
              <X className="w-3 h-3" /> Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
