'use client'

import { useState, useRef, useEffect } from 'react'
import axios from 'axios'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface ChatInterfaceProps {
  userId: string
  sessionId?: string
  initialMessage?: string
}

export default function ChatInterface({ userId, sessionId, initialMessage }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [progress, setProgress] = useState<any>(null)
  const [rolePlayMode, setRolePlayMode] = useState(false)
  const [streaming, setStreaming] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    const initChat = async () => {
      try {
        if (initialMessage) {
          // 새 세션의 초기 AI 메시지 사용
          setMessages([
            {
              role: 'assistant',
              content: initialMessage,
              timestamp: new Date(),
            },
          ])
        } else if (sessionId) {
          // 기존 세션의 메시지 로드
          const response = await axios.get(
            `http://localhost:3001/api/nestjs-aws-learn/session/${sessionId}/messages`
          )

          if (response.data.messages) {
            const loadedMessages: Message[] = response.data.messages.map((msg: any) => ({
              role: msg.role,
              content: msg.content,
              timestamp: new Date(msg.timestamp),
            }))
            setMessages(loadedMessages)
          }
        }
      } catch (error) {
        console.error('Failed to load messages:', error)
        setMessages([
          {
            role: 'assistant',
            content: '❌ 메시지 로드 중 오류가 발생했습니다.',
            timestamp: new Date(),
          },
        ])
      } finally {
        setLoading(false)
      }
    }

    initChat()
  }, [userId, sessionId, initialMessage])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!input.trim()) return

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setSending(true)
    setStreaming(true)

    try {
      // 스트리밍 응답 처리
      const response = await fetch('http://localhost:3001/api/nestjs-aws-learn/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          sessionId,
          message: input,
          rolePlayMode,
        }),
      })

      if (!response.ok) throw new Error('Chat error')

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let aiResponse = ''

      // AI 응답을 실시간으로 표시
      setMessages((prev) => [...prev, { role: 'assistant', content: '', timestamp: new Date() }])

      while (true) {
        const { done, value } = await reader!.read()
        if (done) break

        const chunk = decoder.decode(value)
        aiResponse += chunk

        // 마지막 메시지 업데이트
        setMessages((prev) => {
          const updated = [...prev]
          if (updated[updated.length - 1].role === 'assistant') {
            updated[updated.length - 1].content = aiResponse
          }
          return updated
        })
      }

      // 최종 응답에서 메타데이터 추출 (마지막 줄에 JSON 형식으로)
      const lines = aiResponse.split('\n')
      const lastLine = lines[lines.length - 1]
      if (lastLine.startsWith('{')) {
        try {
          const metadata = JSON.parse(lastLine)
          setProgress(metadata.progress)
          aiResponse = lines.slice(0, -1).join('\n').trim()

          // 메타데이터 제거 후 최종 메시지 업데이트
          setMessages((prev) => {
            const updated = [...prev]
            if (updated[updated.length - 1].role === 'assistant') {
              updated[updated.length - 1].content = aiResponse
            }
            return updated
          })
        } catch (e) {
          // JSON 파싱 실패, 전체 응답 사용
        }
      }
    } catch (error) {
      console.error('Chat error:', error)
      const errorMessage: Message = {
        role: 'assistant',
        content: '❌ 오류가 발생했습니다. 백엔드가 실행 중인지 확인하세요.',
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setSending(false)
      setStreaming(false)
    }
  }

  const handleExport = async () => {
    try {
      const response = await axios.get(
        `http://localhost:3001/api/nestjs-aws-learn/export/${userId}`,
        { responseType: 'blob' }
      )

      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `nestjs-aws-study-${Date.now()}.md`)
      document.body.appendChild(link)
      link.click()
      link.parentNode?.removeChild(link)
    } catch (error) {
      alert('마크다운 내보내기 실패')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-md p-4 border-b-2 border-blue-500">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-3">
            <div>
              <h1 className="text-2xl font-bold text-blue-600">☁️ NestJS + AWS 튜터</h1>
              {progress && (
                <p className="text-sm text-gray-600">
                  📚 {progress.currentTopic} ({progress.currentIndex + 1}/{progress.totalTopics})
                </p>
              )}
            </div>
            <button
              onClick={handleExport}
              className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg transition"
            >
              📥 마크다운 내보내기
            </button>
          </div>

          {/* Role-Play Toggle Button */}
          <div className="flex gap-2">
            <button
              onClick={() => setRolePlayMode(!rolePlayMode)}
              className={`font-bold py-2 px-4 rounded-lg transition ${
                rolePlayMode
                  ? 'bg-purple-600 hover:bg-purple-700 text-white'
                  : 'bg-gray-300 hover:bg-gray-400 text-gray-800'
              }`}
            >
              {rolePlayMode ? '🎭 역할극 ON' : '🎭 역할극 OFF'}
            </button>
            <span className="text-sm text-gray-600 flex items-center">
              {rolePlayMode ? '(실제 사용 사례 시나리오)' : '(일반 학습 모드)'}
            </span>
          </div>
        </div>
      </div>

      {/* Chat Container */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-3">
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} mb-2`}
              >
                <div
                  className={`px-5 py-3 rounded-xl max-w-2xl ${
                    msg.role === 'user'
                      ? 'bg-blue-500 text-white rounded-br-none shadow-md'
                      : 'bg-gray-100 text-gray-800 rounded-bl-none shadow-sm'
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                    {msg.content}
                  </p>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-white border-t-2 border-blue-500 p-4">
        <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.ctrlKey) {
                handleSendMessage(e as any)
              }
            }}
            placeholder={
              streaming
                ? '🔄 AI가 응답 중입니다...'
                : '메시지를 입력하세요... (Ctrl+Enter 전송)'
            }
            rows={3}
            disabled={sending}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none disabled:opacity-50 resize-none"
          />
          <div className="flex flex-col gap-2">
            <button
              type="submit"
              disabled={sending || !input.trim()}
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-6 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed h-fit"
            >
              {sending ? '전송 중...' : '전송'}
            </button>
            {streaming && (
              <div className="flex items-center justify-center gap-2 text-sm text-blue-600">
                <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-r-transparent rounded-full"></div>
                <span>AI 응답 중...</span>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
