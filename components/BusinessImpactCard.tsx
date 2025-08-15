'use client';

import React from 'react';
import {
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  BanknotesIcon,
  ChartBarSquareIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import type { BusinessImpactSummary } from '@/lib/strategic-health';

interface BusinessImpactCardProps {
  impact: BusinessImpactSummary;
  loading?: boolean;
}

export default function BusinessImpactCard({ impact, loading }: BusinessImpactCardProps) {
  if (loading) {
    return (
      <div className="card-primary p-6 animate-pulse">
        <div className="flex items-center gap-2 mb-4">
          <div className="skeleton h-6 w-6 rounded"></div>
          <div className="skeleton h-6 w-48"></div>
        </div>
        <div className="skeleton h-12 w-32 mb-4"></div>
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-16 w-full rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}K`;
    } else {
      return `$${amount.toLocaleString()}`;
    }
  };

  return (
    <div className="card-elevated p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 group hover:shadow-card-elevated-hover transition-all duration-300">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <CurrencyDollarIcon className="w-6 h-6 text-green-600" />
        <h3 className="text-h3 text-gray-900">Business Impact This Month</h3>
      </div>

      {/* Main Value */}
      <div className="mb-6">
        <div className="text-4xl font-bold text-green-600 mb-2 group-hover:scale-105 transition-transform duration-200">
          {formatCurrency(impact.monthlyValue)}
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <ArrowTrendingUpIcon className="w-4 h-4 text-green-500" />
          <span>Projected: {formatCurrency(impact.projectedAnnualValue)} annually</span>
        </div>
      </div>

      {/* Impact Breakdown */}
      <div className="grid grid-cols-3 gap-4">
        {/* Cost Savings */}
        <div className="bg-white bg-opacity-60 rounded-xl p-4 text-center border border-green-100">
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
            <BanknotesIcon className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-lg font-semibold text-gray-900 mb-1">
            {formatCurrency(impact.costSavings)}
          </div>
          <div className="text-xs text-gray-600 font-medium">Cost Savings</div>
        </div>

        {/* Productivity Gains */}
        <div className="bg-white bg-opacity-60 rounded-xl p-4 text-center border border-green-100">
          <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-2">
            <ChartBarSquareIcon className="w-5 h-5 text-orange-600" />
          </div>
          <div className="text-lg font-semibold text-gray-900 mb-1">
            {formatCurrency(impact.productivityGains)}
          </div>
          <div className="text-xs text-gray-600 font-medium">Productivity</div>
        </div>

        {/* Risk Reduction */}
        <div className="bg-white bg-opacity-60 rounded-xl p-4 text-center border border-green-100">
          <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-2">
            <ShieldCheckIcon className="w-5 h-5 text-purple-600" />
          </div>
          <div className="text-lg font-semibold text-gray-900 mb-1">
            {formatCurrency(impact.riskReduction)}
          </div>
          <div className="text-xs text-gray-600 font-medium">Risk Reduction</div>
        </div>
      </div>

      {/* Year Summary */}
      <div className="mt-6 pt-4 border-t border-green-200">
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-700 font-medium">Year to Date</span>
          <span className="text-gray-900 font-semibold">
            {formatCurrency(impact.yearToDateValue)}
          </span>
        </div>
      </div>
    </div>
  );
}
