import { useState, useEffect } from 'react'
import { debugAgent } from '../utils/debugAgent'
import { agentService } from '../hooks/agentService'

const DebugPage = () => {
  const [status, setStatus] = useState({})
  const [logs, setLogs] = useState([])

  useEffect(() => {
    // تحديث الحالة أول مرة
    updateStatus()

    // مستمع للحالة
    const unsubscribe = agentService.addStatusListener((newStatus) => {
      setStatus(newStatus)
      addLog(`Status updated: ${newStatus.status}`)
    })

    return () => unsubscribe()
  }, [])

  const updateStatus = () => {
    setStatus(agentService.getStatus())
  }

  const addLog = (message) => {
    setLogs((prev) => [
      ...prev,
      {
        time: new Date().toLocaleTimeString(),
        message,
      },
    ])
  }

  const runFullDiagnostic = async () => {
    addLog('Running full diagnostic...')
    debugAgent.checkAllComponents()

    try {
      const connectionResult = await debugAgent.testConnectionDirect()
      addLog(`Direct connection: ${connectionResult.success ? '✅' : '❌'}`)
    } catch (error) {
      addLog(`Direct connection error: ${error.message}`)
    }

    updateStatus()
  }

  const reloadAgent = () => {
    addLog('Reloading agent...')
    debugAgent.reloadAgent()
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">
        🔍 Agent Debug Center
      </h1>

      {/* حالة النظام */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow border">
          <h3 className="font-semibold text-gray-700 mb-2">Agent Status</h3>
          <div
            className={`text-lg font-bold ${
              status.status === 'ready'
                ? 'text-green-600'
                : status.status === 'error'
                ? 'text-red-600'
                : 'text-yellow-600'
            }`}
          >
            {status.status || 'unknown'}
          </div>
          {status.error && (
            <div className="mt-2 text-sm text-red-500">{status.error}</div>
          )}
        </div>

        <div className="bg-white p-4 rounded-lg shadow border">
          <h3 className="font-semibold text-gray-700 mb-2">Configuration</h3>
          <div className="space-y-1 text-sm">
            <div>Has Config: {status.hasConfiguration ? '✅' : '❌'}</div>
            <div>Has Loader: {status.hasLoader ? '✅' : '❌'}</div>
            <div>Initialized: {status.isInitialized ? '✅' : '❌'}</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border">
          <h3 className="font-semibold text-gray-700 mb-2">Global Objects</h3>
          <div className="space-y-1 text-sm">
            <div>wxOConfiguration: {window.wxOConfiguration ? '✅' : '❌'}</div>
            <div>wxoLoader: {window.wxoLoader ? '✅' : '❌'}</div>
            <div>agentInstance: {window.agentInstance ? '✅' : '❌'}</div>
          </div>
        </div>
      </div>

      {/* أزرار التحكم */}
      <div className="flex flex-wrap gap-3 mb-6">
        <button
          onClick={runFullDiagnostic}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          🩺 Run Diagnostic
        </button>
        <button
          onClick={reloadAgent}
          className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600"
        >
          🔄 Reload Agent
        </button>
        <button
          onClick={() => agentService.initializeAgent()}
          className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
        >
          🚀 Initialize Agent
        </button>
        <button
          onClick={() => updateStatus()}
          className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
        >
          📡 Refresh Status
        </button>
      </div>

      {/* السجلات */}
      <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm">
        <h3 className="text-lg font-semibold mb-3">📋 Logs</h3>
        <div className="h-96 overflow-y-auto">
          {logs.length === 0 ? (
            <div className="text-gray-400">No logs yet...</div>
          ) : (
            logs.map((log, index) => (
              <div key={index} className="border-b border-gray-700 py-2">
                <span className="text-gray-400">[{log.time}]</span>
                <span className="ml-2">{log.message}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* معلومات التكوين */}
      <div className="mt-6 bg-white p-4 rounded-lg shadow border">
        <h3 className="font-semibold text-gray-700 mb-2">
          Current Configuration
        </h3>
        <pre className="text-sm bg-gray-50 p-3 rounded overflow-x-auto">
          {JSON.stringify(window.wxOConfiguration, null, 2)}
        </pre>
      </div>
    </div>
  )
}

export default DebugPage
