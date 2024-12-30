'use client';

import React from 'react';
import { Line } from 'react-chartjs-2';
import { useTheme } from '../providers/ThemeProvider';

interface CommodityDetailsPopupProps {
  commodity: {
    name: string;
    trend: number;
    change: string;
    status: 'up' | 'down';
    historicalData: {
      price: number[];
      demand: number[];
      supply: number[];
      labels: string[];
    };
  };
  onClose: () => void;
}

export default function CommodityDetailsPopup({ commodity, onClose }: CommodityDetailsPopupProps) {
  const { theme } = useTheme();

  const chartData = {
    labels: commodity.historicalData.labels,
    datasets: [
      {
        label: 'Price',
        data: commodity.historicalData.price,
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1,
        fill: false,
      },
      {
        label: 'Demand',
        data: commodity.historicalData.demand,
        borderColor: 'rgb(255, 99, 132)',
        tension: 0.1,
        fill: false,
      },
      {
        label: 'Supply',
        data: commodity.historicalData.supply,
        borderColor: 'rgb(54, 162, 235)',
        tension: 0.1,
        fill: false,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: theme === 'dark' ? '#f3f4f6' : '#111827',
          font: {
            size: 12,
            weight: 'bold'
          }
        }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
      },
    },
    scales: {
      y: {
        grid: {
          color: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          color: theme === 'dark' ? '#f3f4f6' : '#111827',
        }
      },
      x: {
        grid: {
          color: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          color: theme === 'dark' ? '#f3f4f6' : '#111827',
        }
      },
    },
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 px-4">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className={`relative w-full max-w-3xl rounded-xl shadow-2xl ${
        theme === 'dark' ? 'bg-gray-800' : 'bg-white'
      } p-6`}>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className={`text-2xl font-bold ${
              theme === 'dark' ? 'text-gray-100' : 'text-gray-900'
            }`}>
              {commodity.name}
            </h2>
            <div className={`flex items-center space-x-2 ${
              commodity.status === 'up' ? 'text-green-500' : 'text-red-500'
            }`}>
              <span className="text-lg font-semibold">{commodity.change}</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d={commodity.status === 'up' ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"}
                />
              </svg>
            </div>
          </div>
          
          <div className="h-[400px] mb-6">
            <Line data={chartData} options={chartOptions} />
          </div>

          <div className="grid grid-cols-3 gap-4 text-center">
            <div className={`p-4 rounded-lg ${
              theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
            }`}>
              <p className={`text-sm font-medium ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
              }`}>Current Price</p>
              <p className={`text-xl font-bold ${
                theme === 'dark' ? 'text-gray-100' : 'text-gray-900'
              }`}>
                ${commodity.historicalData.price[commodity.historicalData.price.length - 1].toLocaleString()}
              </p>
            </div>
            <div className={`p-4 rounded-lg ${
              theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
            }`}>
              <p className={`text-sm font-medium ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
              }`}>Current Demand</p>
              <p className={`text-xl font-bold ${
                theme === 'dark' ? 'text-gray-100' : 'text-gray-900'
              }`}>
                {commodity.historicalData.demand[commodity.historicalData.demand.length - 1].toLocaleString()} units
              </p>
            </div>
            <div className={`p-4 rounded-lg ${
              theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
            }`}>
              <p className={`text-sm font-medium ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
              }`}>Current Supply</p>
              <p className={`text-xl font-bold ${
                theme === 'dark' ? 'text-gray-100' : 'text-gray-900'
              }`}>
                {commodity.historicalData.supply[commodity.historicalData.supply.length - 1].toLocaleString()} units
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 