'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Pie } from 'react-chartjs-2';
import CommodityDetailsPopup from './components/CommodityDetailsPopup';
import { chartOptions } from './lib/chartConfig';
import { useRouter } from 'next/navigation';
import { useTheme } from './providers/ThemeProvider';
import { ChartEvent, ActiveElement } from 'chart.js';
import { TooltipItem } from 'chart.js';

interface MarketUpdate {
  time: string;
  message: string;
}

interface CommodityTrend {
  name: string;
  trend: number;
  change: string;
  status: 'up' | 'down' | 'stable';
}

const trendsWithHistory = [
  {
    name: 'Soybeans',
    trend: -2.5,
    change: '-2.5%',
    status: 'down' as const,
    historicalData: {
      price: [2500, 2450, 2400, 2380, 2350],
      demand: [1000, 1100, 1050, 950, 900],
      supply: [1200, 1150, 1100, 1050, 1000],
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    },
  },
  {
    name: 'Coffee',
    trend: 1.8,
    change: '+1.8%',
    status: 'up' as const,
    historicalData: {
      price: [13000, 13200, 13400, 13600, 13800],
      demand: [800, 850, 900, 950, 1000],
      supply: [750, 800, 850, 800, 750],
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    },
  },
  {
    name: 'Maize',
    trend: 0.5,
    change: '+0.5%',
    status: 'up' as const,
    historicalData: {
      price: [900, 905, 910, 915, 920],
      demand: [1500, 1550, 1600, 1650, 1700],
      supply: [1400, 1450, 1500, 1550, 1600],
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    },
  },
  {
    name: 'Sesame',
    trend: -0.8,
    change: '-0.8%',
    status: 'down' as const,
    historicalData: {
      price: [6000, 5950, 5900, 5850, 5800],
      demand: [500, 480, 460, 440, 420],
      supply: [600, 580, 560, 540, 520],
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    },
  },
  {
    name: 'Sunflower',
    trend: 1.2,
    change: '+1.2%',
    status: 'up' as const,
    historicalData: {
      price: [1300, 1315, 1330, 1345, 1360],
      demand: [700, 720, 740, 760, 780],
      supply: [650, 670, 690, 710, 730],
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    },
  },
];

// Define the custom green color to match the logo
const _customGreen = '#4CAF50';

export default function Home() {
  const router = useRouter();
  const { theme } = useTheme();

  const [marketUpdates] = useState<MarketUpdate[]>([
    { time: '11:30', message: 'Commodity prices increase after Karuma closure.' },
    { time: '05:30', message: 'Coffee farmers smiling to the bank.' },
    { time: '03:30', message: 'Sesame prices rise by 1.5% as demand increases.' },
    { time: '05:30', message: 'Coffee prices fall by 2% as supply increases.' },
    { time: '08:00', message: 'Maize prices rise by 1% as demand increases.' },
  ]);

  const [trends] = useState<CommodityTrend[]>([
    { name: 'Soybeans', trend: -2.5, change: '-2.5%', status: 'down' },
    { name: 'Coffee', trend: 1.8, change: '+1.8%', status: 'up' },
    { name: 'Maize', trend: 0.5, change: '+0.5%', status: 'up' },
    { name: 'Sesame', trend: -0.8, change: '-0.8%', status: 'down' },
    { name: 'Sunflower', trend: 1.2, change: '+1.2%', status: 'up' },
  ]);

  const [selectedCommodity, setSelectedCommodity] = useState<typeof trendsWithHistory[0] | null>(null);

  const handleStartTrading = () => {
    router.push('/login?returnUrl=/TradeCommodities');
  };

  const handleChartClick = (
    event: ChartEvent,
    elements: ActiveElement[]
  ) => {
    if (elements.length > 0) {
      const index = elements[0].index;
      const selected = trendsWithHistory[index];
      setSelectedCommodity(selected);
    }
  };

  const pieData = {
    labels: trends.map(t => t.name),
    datasets: [
      {
        data: trends.map(t => Math.abs(t.trend)),
        backgroundColor: [
          'rgba(255, 99, 132, 0.8)',
          'rgba(54, 162, 235, 0.8)',
          'rgba(255, 206, 86, 0.8)',
          'rgba(75, 192, 192, 0.8)',
          'rgba(153, 102, 255, 0.8)',
        ],
        hoverBackgroundColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
        ],
        borderWidth: 2,
        borderColor: theme === 'dark' ? '#1f2937' : '#ffffff',
      },
    ],
  };

  const chartConfig = {
    ...chartOptions,
    maintainAspectRatio: false,
    onClick: handleChartClick,
    plugins: {
      ...chartOptions.plugins,
      legend: {
        ...chartOptions.plugins?.legend,
        labels: {
          color: theme === 'dark' ? '#f3f4f6' : '#111827',
          padding: 20,
          font: {
            size: 14,
            weight: 'bold' as const
          }
        },
        position: 'bottom' as const
      },
      tooltip: {
        callbacks: {
          label: (context: TooltipItem<'pie'>) => {
            const label = context.label || '';
            const value = context.parsed || 0;
            return `${label}: ${value.toFixed(1)}%`;
          }
        }
      }
    },
    elements: {
      arc: {
        borderWidth: 2,
        hoverOffset: 10
      }
    },
    hover: {
      mode: 'nearest' as const
    },
    interaction: {
      mode: 'nearest' as const,
      intersect: true
    }
  };

  return (
    <div className={`min-h-screen ${
      theme === 'dark' ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'
    }`}>
      {/* Welcome Section */}
      <div className={`py-20 ${
        theme === 'dark' ? 'bg-gray-800' : 'bg-white'
      }`}>
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className={`text-5xl font-bold mb-6 ${
            theme === 'dark' ? 'text-gray-100' : 'text-gray-900'
          }`}>
            Welcome to Fotis Agro Trading Platform
          </h1>
          <p className={`text-xl mb-8 ${
            theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
          }`}>
            The Harvest is Plenty, the Labourers are few.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/signup"
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
            >
              Get Started
            </Link>
            <button
              onClick={handleStartTrading}
              className={`${
                theme === 'dark' 
                  ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                  : 'bg-white hover:bg-gray-100 text-gray-900'
              } px-8 py-3 rounded-lg font-semibold transition-colors border border-gray-300`}
            >
              Start Trading
            </button>
          </div>
        </div>
      </div>

      {/* Floating Market Updates Ticker */}
      <div className="relative -mt-6 mb-6">
        <div className="max-w-7xl mx-auto px-4">
          <div className={`rounded-xl shadow-lg ${
            theme === 'dark' ? 'bg-gray-800' : 'bg-white'
          } p-4 transform hover:scale-[1.01] transition-all duration-300`}>
            <div className="overflow-hidden">
              <div className="animate-marquee whitespace-nowrap flex items-center">
                {trends.map((item, index) => (
                  <div key={index} className="inline-flex items-center mx-6">
                    <span className={`font-medium ${
                      theme === 'dark' ? 'text-gray-200' : 'text-gray-900'
                    }`}>
                      {item.name}:
                    </span>
                    <span className={`ml-2 ${
                      item.status === 'up' ? 'text-green-600' : 'text-red-500'
                    } font-semibold`}>
                      {item.change}
                      <span className="ml-1">
                        {item.status === 'up' ? '↑' : '↓'}
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Market Updates Section */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 gap-12">
          {/* Live Market Updates */}
          <div className={`rounded-xl shadow-lg transform hover:scale-[1.01] transition-all duration-300 ${
            theme === 'dark' ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className="p-6">
              <h2 className={`text-2xl font-bold mb-6 ${
                theme === 'dark' ? 'text-gray-100' : 'text-gray-900'
              }`}>
                Live Market Updates
              </h2>
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                {marketUpdates.map((update, index) => (
                  <div
                    key={index}
                    className={`flex items-start space-x-4 p-4 rounded-lg transition-colors ${
                      theme === 'dark' 
                        ? 'bg-gray-700 hover:bg-gray-600' 
                        : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    <div className={`flex-shrink-0 text-sm font-medium ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      {update.time}
                    </div>
                    <p className={`text-[15px] leading-relaxed font-medium ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      {update.message}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Market Distribution */}
          <div className={`rounded-xl shadow-lg transform hover:scale-[1.01] transition-all duration-300 ${
            theme === 'dark' ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className="p-6">
              <h2 className={`text-2xl font-bold mb-6 ${
                theme === 'dark' ? 'text-gray-100' : 'text-gray-900'
              }`}>
                Market Distribution
              </h2>
              <div className="relative">
                <div className="h-[400px] flex items-center justify-center">
                  <Pie 
                    data={{
                      ...pieData,
                      datasets: [{
                        ...pieData.datasets[0],
                        backgroundColor: [
                          'rgb(22, 163, 74, 0.8)', // green-600 with opacity
                          'rgba(54, 162, 235, 0.8)',
                          'rgba(255, 206, 86, 0.8)',
                          'rgba(75, 192, 192, 0.8)',
                          'rgba(153, 102, 255, 0.8)',
                        ],
                        hoverBackgroundColor: [
                          'rgb(21, 128, 61)', // green-700
                          'rgba(54, 162, 235, 1)',
                          'rgba(255, 206, 86, 1)',
                          'rgba(75, 192, 192, 1)',
                          'rgba(153, 102, 255, 1)',
                        ],
                      }]
                    }}
                    options={chartConfig}
                  />
                </div>
                <p className={`text-center mt-4 text-sm ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Click on a segment to view detailed commodity information
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className={`py-16 ${
        theme === 'dark' ? 'bg-gray-800' : 'bg-white'
      }`}>
        <div className="max-w-7xl mx-auto px-4">
          <h2 className={`text-3xl font-bold text-center mb-12 ${
            theme === 'dark' ? 'text-gray-100' : 'text-gray-900'
          }`}>
            Why Choose Fotis Agro
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: 'Fast Trading',
                description: 'Execute trades quickly and efficiently with our advanced trading platform',
                icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              },
              {
                title: 'Secure Platform',
                description: 'Trade with confidence knowing your transactions are protected',
                icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              },
              {
                title: 'Fair Pricing',
                description: 'Get competitive prices and transparent fee structure',
                icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
              }
            ].map((feature, index) => (
              <div key={index} className={`p-8 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-300 ${
                theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-white hover:bg-gray-50'
              }`}>
                <div className="text-green-600 mb-4">
                  <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {feature.icon}
                  </svg>
                </div>
                <h3 className={`text-xl font-bold mb-3 ${
                  theme === 'dark' ? 'text-gray-100' : 'text-gray-900'
                }`}>
                  {feature.title}
                </h3>
                <p className={
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                }>
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Commodity Details Popup */}
      {selectedCommodity && (
        <CommodityDetailsPopup
          commodity={selectedCommodity}
          onClose={() => setSelectedCommodity(null)}
        />
      )}
    </div>
  );
}