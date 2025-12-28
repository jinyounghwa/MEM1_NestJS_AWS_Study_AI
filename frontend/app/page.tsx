'use client'

import { useState } from 'react'
import ChatInterface from '@/components/ChatInterface'
import Sidebar from '@/components/Sidebar'

export default function Home() {
  const [started, setStarted] = useState(false)
  const [userId, setUserIdInput] = useState('')
  const [topics, setTopics] = useState('')
  const [loading, setLoading] = useState(false)
  const [currentSessionId, setCurrentSessionId] = useState<string>()

  const handleStart = async () => {
    if (!userId.trim() || !topics.trim()) {
      alert('사용자 ID와 학습 주제를 입력해주세요.')
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

  if (started && userId) {
    return (
      <>
        <Sidebar
          userId={userId}
          currentSessionId={currentSessionId}
          onSessionSelect={handleSessionSelect}
          onNewSession={handleNewSession}
        />
        <ChatInterface userId={userId} sessionId={currentSessionId} />
      </>
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              👤 사용자 ID
            </label>
            <input
              type="text"
              value={userId}
              onChange={(e) => setUserIdInput(e.target.value)}
              placeholder="예: student-001"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
            />
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
            <li>1. 사용자 ID를 입력하세요</li>
            <li>2. 학습할 주제를 입력하세요 (쉼표로 구분)</li>
            <li>3. 학습 시작 버튼을 클릭하세요</li>
            <li>4. AI의 설명을 듣고 &lt;IS&gt;요약&lt;/IS&gt; 태그로 요약하세요</li>
            <li>5. 완료 후 마크다운 파일로 내보낼 수 있습니다</li>
          </ol>
        </div>
      </div>
    </main>
  )
}
