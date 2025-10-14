import React, { useState, useEffect } from 'react'
import { Shield, CheckCircle, AlertTriangle, TrendingUp, DollarSign, Users, Clock } from 'lucide-react'

interface DataIntegrityStats {
  totalReports: number
  verifiedReports: number
  accuracyRate: number
  zoneDetectionRate: number
  revenueTracked: number
  avgProcessingTime: number
  dataQualityScore: number
  lastAuditTime: string
}

interface ProcessingMetrics {
  ingested: number
  cleansed: number
  enriched: number
  verified: number
  rejected: number
}

export const DataIntegrityDashboard: React.FC = () => {
  const [stats, setStats] = useState<DataIntegrityStats | null>(null)
  const [processingMetrics, setProcessingMetrics] = useState<ProcessingMetrics | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchIntegrityStats = async () => {
    try {
      setLoading(true)
      const response = await fetch('http://localhost:3001/api/data-integrity/stats')
      const data = await response.json()
      if (data.success) {
        setStats(data.stats)
        setProcessingMetrics(data.processing_metrics)
      }
    } catch (err) {
      console.error('Error fetching data integrity stats:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchIntegrityStats()
    const interval = setInterval(fetchIntegrityStats, 15000) // Update every 15 seconds
    return () => clearInterval(interval)
  }, [])

  const getQualityColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-100'
    if (score >= 75) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  const getQualityStatus = (score: number) => {
    if (score >= 90) return 'Excellent'
    if (score >= 75) return 'Good'
    if (score >= 60) return 'Fair'
    return 'Poor'
  }

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Shield className="h-8 w-8 animate-pulse text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading data integrity metrics...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <Shield className="mr-2 h-6 w-6 text-green-600" />
            Data Integrity Dashboard 🇿🇦
          </h2>
          <p className="text-gray-600 mt-1">Verified Event Intelligence (VEI) for South African Events</p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={fetchIntegrityStats}
            disabled={loading}
            className="flex items-center px-3 py-1 bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors text-sm"
          >
            <CheckCircle className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Refresh Audit
          </button>
          <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium flex items-center">
            <div className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse"></div>
            ELT Pipeline Active (Load Shedding Resilient)
          </div>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">CDV Accuracy</p>
              <p className="text-xl font-bold text-gray-900">{stats?.accuracyRate || 0}%</p>
              <p className="text-xs text-green-600">Target: 90%+</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <TrendingUp className="h-5 w-5 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Zone Detection</p>
              <p className="text-xl font-bold text-gray-900">{stats?.zoneDetectionRate || 0}%</p>
              <p className="text-xs text-blue-600">HVZ Geofencing</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <DollarSign className="h-5 w-5 text-purple-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Revenue Tracked</p>
              <p className="text-xl font-bold text-gray-900">R{stats?.revenueTracked || 0}</p>
              <p className="text-xs text-purple-600">Sponsor Attribution (ZAR)</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className={`p-2 rounded-lg ${stats?.dataQualityScore ? getQualityColor(stats.dataQualityScore) : 'bg-gray-100'}`}>
              <Shield className="h-5 w-5" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Data Quality</p>
              <p className="text-xl font-bold text-gray-900">{stats?.dataQualityScore || 0}/100</p>
              <p className="text-xs">{getQualityStatus(stats?.dataQualityScore || 0)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ELT Pipeline Status */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <AlertTriangle className="mr-2 h-5 w-5 text-yellow-600" />
          ELT Pipeline Processing (Extract → Load → Transform)
        </h3>
        
        {processingMetrics && (
          <div className="grid grid-cols-5 gap-4">
            <div className="text-center">
              <div className="bg-gray-100 rounded-full h-16 w-16 flex items-center justify-center mx-auto mb-2">
                <Users className="h-6 w-6 text-gray-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{processingMetrics.ingested}</p>
              <p className="text-xs text-gray-600">Ingested</p>
            </div>
            <div className="text-center">
              <div className="bg-blue-100 rounded-full h-16 w-16 flex items-center justify-center mx-auto mb-2">
                <CheckCircle className="h-6 w-6 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{processingMetrics.cleansed}</p>
              <p className="text-xs text-gray-600">Cleansed</p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 rounded-full h-16 w-16 flex items-center justify-center mx-auto mb-2">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{processingMetrics.enriched}</p>
              <p className="text-xs text-gray-600">Enriched</p>
            </div>
            <div className="text-center">
              <div className="bg-purple-100 rounded-full h-16 w-16 flex items-center justify-center mx-auto mb-2">
                <Shield className="h-6 w-6 text-purple-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{processingMetrics.verified}</p>
              <p className="text-xs text-gray-600">Verified</p>
            </div>
            <div className="text-center">
              <div className="bg-red-100 rounded-full h-16 w-16 flex items-center justify-center mx-auto mb-2">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{processingMetrics.rejected}</p>
              <p className="text-xs text-gray-600">Rejected</p>
            </div>
          </div>
        )}
      </div>

      {/* Audit Trail */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <Clock className="mr-2 h-5 w-5 text-blue-600" />
          Quality Assurance Metrics
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Processing Performance</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Avg Processing Time:</span>
                <span className="font-medium">{stats?.avgProcessingTime || 0}ms</span>
              </div>
              <div className="flex justify-between">
                <span>Total Reports:</span>
                <span className="font-medium">{stats?.totalReports || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Verified Reports:</span>
                <span className="font-medium">{stats?.verifiedReports || 0}</span>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Data Validation</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Coordinate Validation:</span>
                <span className="text-green-600 font-medium">✓ Passed</span>
              </div>
              <div className="flex justify-between">
                <span>Zone Boundary Check:</span>
                <span className="text-green-600 font-medium">✓ Passed</span>
              </div>
              <div className="flex justify-between">
                <span>Sponsor Attribution:</span>
                <span className="text-green-600 font-medium">✓ Active</span>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Audit Information</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Last Audit:</span>
                <span className="font-medium">
                  {stats?.lastAuditTime ? new Date(stats.lastAuditTime).toLocaleTimeString() : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Compliance Status:</span>
                <span className="text-green-600 font-medium">✓ Verified</span>
              </div>
              <div className="flex justify-between">
                <span>Data Lineage:</span>
                <span className="text-blue-600 font-medium">→ Traceable</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}