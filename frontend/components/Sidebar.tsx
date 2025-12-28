'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'

interface Session {
  id: string
  topics: string[]
  currentTopic: string
  currentTopicIndex: number
  totalTopics: number
  stepCount: number
  messageCount: number
  createdAt: string
}

interface SidebarProps {
  userId: string
  currentSessionId?: string
  onSessionSelect: (sessionId: string) => void
  onNewSession: () => void
}

export default function Sidebar({ userId, currentSessionId, onSessionSelect, onNewSession }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchSessions()
  }, [userId])

  const fetchSessions = async () => {
    setLoading(true)
    try {
      const response = await axios.get(
        `http://localhost:3001/api/nestjs-aws-learn/sessions/${userId}`
      )

      if (response.data.sessions) {
        setSessions(response.data.sessions)
      }
    } catch (error) {
      console.error('Failed to fetch sessions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSessionClick = (sessionId: string) => {
    onSessionSelect(sessionId)
    setIsOpen(false)
  }

  const handleDeleteSession = async (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation()

    // 삭제 확인
    if (!confirm('이 세션을 삭제하시겠습니까? 저장된 모든 메시지가 삭제됩니다.')) {
      return
    }

    try {
      await axios.delete(`http://localhost:3001/api/nestjs-aws-learn/session/${sessionId}`, {
        data: { userId },
      })

      // 세션 목록 새로고침
      await fetchSessions()
    } catch (error) {
      console.error('Failed to delete session:', error)
      alert('세션 삭제에 실패했습니다.')
    }
  }

  return (
    <>
      {/* 햅버거 버튼 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 p-2 hover:bg-gray-200 rounded-lg transition"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d={isOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'}
          />
        </svg>
      </button>

      {/* 배경 오버레이 */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* 사이드바 */}
      <aside
        className={`fixed left-0 top-0 h-full w-64 bg-white shadow-lg transform transition-transform duration-300 z-40 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* 사이드바 헤더 */}
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold text-blue-600">📚 학습 세션</h2>
          <p className="text-sm text-gray-600 mt-1">{userId}</p>
        </div>

        {/* 새 세션 버튼 */}
        <div className="p-4 border-b">
          <button
            onClick={() => {
              onNewSession()
              setIsOpen(false)
            }}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition"
          >
            + 새로운 세션
          </button>
        </div>

        {/* 세션 목록 */}
        <div className="overflow-y-auto h-[calc(100%-200px)]">
          {loading ? (
            <div className="p-4 text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
            </div>
          ) : sessions.length === 0 ? (
            <div className="p-4 text-center text-gray-500 text-sm">
              저장된 세션이 없습니다
            </div>
          ) : (
            <ul className="space-y-2 p-4">
              {sessions.map((session) => (
                <li key={session.id} className="group">
                  <div
                    onClick={() => handleSessionClick(session.id)}
                    className={`flex items-center justify-between p-3 rounded-lg transition cursor-pointer ${
                      currentSessionId === session.id
                        ? 'bg-blue-100 border-l-4 border-blue-500'
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">
                        {session.currentTopic}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        {session.currentTopicIndex + 1}/{session.totalTopics}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        💬 {session.messageCount} 메시지
                      </p>
                      <p className="text-xs text-gray-400 mt-2">
                        {new Date(session.createdAt).toLocaleDateString('ko-KR')}
                      </p>
                    </div>

                    {/* 삭제 버튼 - hover 시 표시 */}
                    <button
                      onClick={(e) => handleDeleteSession(e, session.id)}
                      className="ml-2 p-2 text-red-500 hover:bg-red-100 rounded-lg opacity-0 group-hover:opacity-100 transition"
                      title="세션 삭제"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>
    </>
  )
}
