import { useRef, useState } from 'react'
import { Mic, Square, Play, X } from 'lucide-react'
import toast from 'react-hot-toast'

interface VoiceRecorderProps {
  onRecordingComplete: (blob: Blob, duration: number) => void
  onRecordingStarted?: () => void
  onRecordingCancelled?: () => void
}

export default function VoiceRecorder({
  onRecordingComplete,
  onRecordingStarted,
  onRecordingCancelled
}: VoiceRecorderProps) {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [duration, setDuration] = useState(0)
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const getSupportedMimeType = (): string => {
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/mp4',
    ]
    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type
      }
    }
    return ''
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        }
      })

      const mimeType = getSupportedMimeType()
      const options: MediaRecorderOptions = mimeType ? { mimeType } : {}
      const mediaRecorder = new MediaRecorder(stream, options)

      const chunks: BlobPart[] = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data)
        }
      }

      mediaRecorder.onstop = () => {
        const recordedMime = mediaRecorder.mimeType || 'audio/webm'
        const blob = new Blob(chunks, { type: recordedMime })
        setRecordedBlob(blob)

        // Stop all tracks
        stream.getTracks().forEach(track => track.stop())
      }

      // Request data every 250ms for more reliable recording
      mediaRecorder.start(250)
      mediaRecorderRef.current = mediaRecorder
      setIsRecording(true)
      setDuration(0)
      onRecordingStarted?.()

      // Start timer
      timerIntervalRef.current = setInterval(() => {
        setDuration(prev => prev + 1)
      }, 1000)

      toast.success('Recording started... Speak now')
    } catch (error) {
      console.error('Error accessing microphone:', error)
      toast.error('Unable to access microphone. Please check permissions.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current)
      }
    }
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

  const togglePlayback = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
        setIsPlaying(false)
      } else {
        audioRef.current.play()
        setIsPlaying(true)
      }
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Hidden audio element for playback
  const playbackUrl = recordedBlob ? URL.createObjectURL(recordedBlob) : undefined

  return (
    <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
      <label className="block text-sm font-medium text-gray-700 mb-3">
        Voice Recording (Optional)
      </label>

      {!recordedBlob ? (
        // Recording section
        <div className="flex items-center gap-3">
          {!isRecording ? (
            <>
              <button
                type="button"
                onClick={startRecording}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                <Mic className="w-4 h-4" />
                Start Recording
              </button>
              <p className="text-sm text-gray-600">Click to record your complaint details via voice</p>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 flex-1">
                <div className="relative">
                  <div className="absolute inset-0 animate-pulse bg-red-500 rounded-full opacity-75"></div>
                  <div className="relative w-3 h-3 bg-red-600 rounded-full"></div>
                </div>
                <span className="text-sm font-medium text-gray-900">Recording in progress</span>
                <span className="text-sm font-mono text-gray-600">{formatTime(duration)}</span>
              </div>
              <button
                type="button"
                onClick={stopRecording}
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
              >
                <Square className="w-4 h-4" />
                Stop
              </button>
            </>
          )}
        </div>
      ) : (
        // Playback section
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Play className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">
              Recording: {formatTime(duration)}
            </span>
          </div>

          <audio
            ref={audioRef}
            src={playbackUrl}
            onEnded={() => setIsPlaying(false)}
            className="hidden"
          />

          <div className="flex gap-2 flex-wrap">
            <button
              type="button"
              onClick={togglePlayback}
              className="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              {isPlaying ? 'Pause' : 'Play'}
            </button>

            <button
              type="button"
              onClick={submitRecording}
              className="px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              Use This Recording
            </button>

            <button
              type="button"
              onClick={cancelRecording}
              className="px-3 py-2 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition flex items-center gap-1"
            >
              <X className="w-4 h-4" />
              Re-record
            </button>
          </div>
        </div>
      )}

      <p className="text-xs text-gray-500 mt-2">
        Maximum recording size: 10MB. Supported formats: WebM, MP3, MP4, WAV, OGG
      </p>
    </div>
  )
}
