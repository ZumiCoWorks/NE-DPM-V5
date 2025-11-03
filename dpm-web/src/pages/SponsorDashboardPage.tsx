import React from 'react'
import { DollarSign, CheckCircle, Users, Target } from 'lucide-react'

const SponsorDashboardPage: React.FC = () => {
  // Static dummy stats per task
  const qualifiedLeads = 42
  const verifiedEngagements = 135
  const engagementRate = Math.round((verifiedEngagements / (qualifiedLeads || 1)) * 100)

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <DollarSign className="mr-2 h-6 w-6 text-blue-600" />
            Sponsor Dashboard
          </h1>
          <p className="text-gray-600 mt-1">Promotional overview and leads</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Qualified Leads</p>
                <p className="text-xl font-bold text-gray-900">{qualifiedLeads}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Verified Engagements</p>
                <p className="text-xl font-bold text-gray-900">{verifiedEngagements}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Target className="h-5 w-5 text-purple-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Engagement Rate</p>
                <p className="text-xl font-bold text-gray-900">{engagementRate}%</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Leads & Engagements</h3>
            <p className="text-sm text-gray-600 mt-1">Sample static data for promotion</p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lead</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Engagements</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">Lead #1</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Qualified</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">3</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">Lead #2</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Verified</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">1</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">Lead #3</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Qualified</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">2</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SponsorDashboardPage
