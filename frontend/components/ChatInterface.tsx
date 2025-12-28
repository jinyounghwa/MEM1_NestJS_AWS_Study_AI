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
}

export default function ChatInterface({ userId }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [progress, setProgress] = useState<any>(null)
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
        // AI의 초기 인사말 추가
        setMessages([
          {
            role: 'assistant',
            content: '안녕하세요! 📚 NestJS와 AWS 학습을 시작하겠습니다.\n\n먼저 학습 내용을 설명한 후, <IS>태그 안에 당신의 이해를 요약해주세요.\n\n준비되셨으면 "준비됐어" 또는 아무 메시지나 입력해주세요.',
            timestamp: new Date(),
          },
        ])
      } finally {
        setLoading(false)
      }
    }

    initChat()
  }, [userId])

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

    try {
      const response = await axios.post('http://localhost:3001/api/nestjs-aws-learn/chat', {
        userId,
        message: input,
      })

      const aiMessage: Message = {
        role: 'assistant',
        content: response.data.response,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, aiMessage])
      setProgress(response.data.progress)

      if (response.data.tip) {
        console.log('💡 팁:', response.data.tip)
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
        <div className="max-w-6xl mx-auto flex justify-between items-center">
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
      </div>

      {/* Chat Container */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-2xl mx-auto space-y-4">
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-md p-4 rounded-lg ${
                    msg.role === 'user'
                      ? 'bg-blue-500 text-white rounded-br-none'
                      : 'bg-gray-200 text-gray-800 rounded-bl-none'
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-white border-t-2 border-blue-500 p-4">
        <form onSubmit={handleSendMessage} className="max-w-2xl mx-auto flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.ctrlKey) {
                handleSendMessage(e as any)
              }
            }}
            placeholder="메시지를 입력하세요... (Ctrl+Enter 전송)"
            rows={3}
            disabled={sending}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none disabled:opacity-50 resize-none"
          />
          <button
            type="submit"
            disabled={sending || !input.trim()}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-6 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed h-fit"
          >
            {sending ? '전송 중...' : '전송'}
          </button>
        </form>
      </div>
    </div>
  )
}
