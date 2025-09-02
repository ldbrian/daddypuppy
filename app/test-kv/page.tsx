"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Database, CheckCircle, XCircle, Loader2, RefreshCw } from "lucide-react"

type TestResult = {
  success?: boolean
  message?: string
  tests?: any
  error?: string
  details?: any
  timestamp?: string
}

export default function TestKVPage() {
  const [result, setResult] = useState<TestResult | null>(null)
  const [loading, setLoading] = useState(false)

  const runTest = async () => {
    setLoading(true)
    setResult(null)

    try {
      const response = await fetch("/api/test-kv", {
        method: "GET",
        cache: "no-store",
      })

      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({
        success: false,
        error: "Network error",
        details: { message: (error as Error).message },
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = () => {
    if (loading) return <Loader2 className="size-5 animate-spin text-blue-500" />
    if (result?.success) return <CheckCircle className="size-5 text-green-500" />
    if (result?.success === false) return <XCircle className="size-5 text-red-500" />
    return <Database className="size-5 text-gray-500" />
  }

  const getStatusBadge = () => {
    if (loading) return <Badge className="bg-blue-100 text-blue-800">Testing...</Badge>
    if (result?.success) return <Badge className="bg-green-100 text-green-800">Connected ✅</Badge>
    if (result?.success === false) return <Badge className="bg-red-100 text-red-800">Failed ❌</Badge>
    return <Badge className="bg-gray-100 text-gray-800">Not Tested</Badge>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Vercel KV Connection Test</h1>
          <p className="text-gray-600">Test your Memoir app's KV database connection</p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getStatusIcon()}
                <span>KV Database Status</span>
              </div>
              {getStatusBadge()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <p className="text-gray-600">
                {loading
                  ? "Testing connection to Vercel KV..."
                  : result
                    ? result.message || (result.success ? "Connection successful!" : "Connection failed")
                    : "Click the button to test your KV database connection"}
              </p>
              <Button onClick={runTest} disabled={loading} className="flex items-center gap-2">
                <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
                {loading ? "Testing..." : "Test Connection"}
              </Button>
            </div>

            {result && (
              <div className="space-y-4">
                {/* 环境变量检查 */}
                {result.tests?.environment && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold mb-2">Environment Variables</h3>
                    <div className="space-y-1 text-sm">
                      {Object.entries(result.tests.environment).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className="font-mono">{key}:</span>
                          <span>{value as string}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 操作测试结果 */}
                {result.tests?.operations && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold mb-2">Operation Tests</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {Object.entries(result.tests.operations).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className="capitalize">{key}:</span>
                          <span>{value as string}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 错误详情 */}
                {result.details && (
                  <details className="bg-red-50 p-4 rounded-lg">
                    <summary className="cursor-pointer font-semibold text-red-800">Error Details</summary>
                    <pre className="mt-2 text-xs overflow-auto bg-white p-2 rounded border">
                      {JSON.stringify(result.details, null, 2)}
                    </pre>
                  </details>
                )}

                {/* 测试数据 */}
                {result.tests?.data && (
                  <details className="bg-green-50 p-4 rounded-lg">
                    <summary className="cursor-pointer font-semibold text-green-800">Test Data</summary>
                    <pre className="mt-2 text-xs overflow-auto bg-white p-2 rounded border">
                      {JSON.stringify(result.tests.data, null, 2)}
                    </pre>
                  </details>
                )}

                <div className="text-xs text-gray-500 text-right">
                  Last tested: {result.timestamp ? new Date(result.timestamp).toLocaleString() : "Unknown"}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {result?.success && (
          <Card className="bg-green-50 border-green-200">
            <CardContent className="pt-6">
              <div className="text-center">
                <CheckCircle className="size-12 text-green-500 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-green-800 mb-2">KV Connection Successful! 🎉</h3>
                <p className="text-green-700 mb-4">
                  Your Memoir app is ready to store and retrieve data from Vercel KV.
                </p>
                <Button asChild className="bg-green-600 hover:bg-green-700">
                  <a href="/">Go to Memoir App</a>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
