'use client'

import { useState, useEffect } from 'react'
import ChatInterface from '@/components/ChatInterface'
import Sidebar from '@/components/Sidebar'

interface InitialMessage {
  sessionId: string
  message: string
}

export default function Home() {
  const [started, setStarted] = useState(false)
  const [userId, setUserId] = useState<string>('')
  const [topics, setTopics] = useState('')
  const [loading, setLoading] = useState(false)
  const [currentSessionId, setCurrentSessionId] = useState<string>()
  const [initialMessage, setInitialMessage] = useState<InitialMessage | null>(null)

  // Initialize or retrieve userId from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('tutorUserId')
    if (stored) {
      setUserId(stored)
    } else {
      const generated = `user-${Date.now()}`
      localStorage.setItem('tutorUserId', generated)
      setUserId(generated)
    }
  }, [])

  const handleStart = async () => {
    if (!topics.trim()) {
      alert('학습 주제를 입력해주세요.')
      return
    }

    setLoading(true)
    try {
      const topicArray = topics.split(',').map(t => t.trim())

      const response = await fetch('http://localhost:3001/api/nestjs-aws-learn/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, topics: topicArray }),
      })

      if (response.ok) {
        const data = await response.json()
        setCurrentSessionId(data.sessionId)
        setInitialMessage({
          sessionId: data.sessionId,
          message: data.initialMessage,
        })
        setStarted(true)
      } else {
        alert('학습 시작 실패. 백엔드가 실행 중인지 확인하세요.')
      }
    } catch (error) {
      alert('백엔드 연결 실패: ' + error)
    } finally {
      setLoading(false)
    }
  }

  const handleSessionSelect = async (sessionId: string) => {
    try {
      const response = await fetch(`http://localhost:3001/api/nestjs-aws-learn/resume/${sessionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })

      if (response.ok) {
        setCurrentSessionId(sessionId)
      } else {
        alert('세션 재개 실패')
      }
    } catch (error) {
      alert('세션 재개 중 오류: ' + error)
    }
  }

  const handleNewSession = () => {
    setStarted(false)
    setCurrentSessionId(undefined)
    setTopics('')
  }

  if (started && userId && currentSessionId) {
    return (
      <>
        <Sidebar
          userId={userId}
          currentSessionId={currentSessionId}
          onSessionSelect={handleSessionSelect}
          onNewSession={handleNewSession}
        />
        <ChatInterface
          userId={userId}
          sessionId={currentSessionId}
          initialMessage={initialMessage?.message}
        />
      </>
    )
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500 mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">학습 시작 중...</h2>
          <p className="text-gray-600">AI가 첫 번째 설명을 준비하고 있습니다</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 mb-2">
            ☁️ NestJS + AWS 학습
          </h1>
          <p className="text-gray-600 text-lg">MEM1 기반 AI 튜터 시스템</p>
        </div>

        <div className="space-y-6">
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <p className="text-sm text-green-800">
              ✅ <span className="font-semibold">자동 사용자 ID:</span> {userId}
            </p>
            <p className="text-xs text-green-700 mt-1">세션 재개 시 이 ID로 자동 식별됩니다</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              📚 학습 주제 (쉼표로 구분)
            </label>
            <textarea
              value={topics}
              onChange={(e) => setTopics(e.target.value)}
              placeholder="예: NestJS Module 구조, AWS VPC 설정, Security Group 설정"
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition resize-none"
            />
            <p className="text-xs text-gray-500 mt-2">
              💡 여러 주제를 순차적으로 학습할 수 있습니다 (Multi-Objective)
            </p>
          </div>

          <button
            onClick={handleStart}
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-3 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '시작 중...' : '🚀 학습 시작'}
          </button>
        </div>

        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-gray-800 mb-2">📖 사용 방법:</h3>
          <ol className="text-sm text-gray-700 space-y-1">
            <li>1. 학습할 주제를 입력하세요 (쉼표로 구분)</li>
            <li>2. 학습 시작 버튼을 클릭하세요</li>
            <li>3. AI의 설명을 듣고 &lt;IS&gt;요약&lt;/IS&gt; 태그로 요약하세요</li>
            <li>4. "다음 주제"라고 입력하면 다음 주제로 진행합니다</li>
            <li>5. 완료 후 마크다운 파일로 내보낼 수 있습니다</li>
          </ol>
        </div>
      </div>
    </main>
  )
}
