'use client';

import { useState } from 'react';
import Link from 'next/link';
import Head from 'next/head'; // Import Head for SEO
import { Pie } from 'react-chartjs-2';
import CommodityDetailsPopup from './components/CommodityDetailsPopup';
import { chartOptions } from './lib/chartConfig';
import { useRouter } from 'next/navigation';
import { useTheme } from './providers/ThemeProvider';
import { ChartEvent, ActiveElement } from 'chart.js';
import { TooltipItem } from 'chart.js';

// Define the currency formatter for UGX
const currencyFormatter = new Intl.NumberFormat('en-UG', {
  style: 'currency',
  currency: 'UGX',
});

interface MarketUpdate {
  time: string;
  message: string;
}

interface CommodityTrend {
  name: string;
  trend: number;
  change: string;
  status: 'up' | 'down' | 'stable';
  price: number; // Added price field
}

// Sample trendsWithHistory data (assumed from previous context)
const trendsWithHistory = [
  {
    name: 'Soybeans',
    trend: -2.5,
    change: '-2.5%',
    status: 'down',
    historicalData: { price: [2300, 2350, 2325] }
  },
  {
    name: 'Coffee',
    trend: 1.8,
    change: '1.8%',
    status: 'up',
    historicalData: { price: [1800, 1850, 1880] }
  },
  // Add more commodities as needed
];

export default function Home() {
  const router = useRouter();
  const { theme } = useTheme();

  const [marketUpdates] = useState<MarketUpdate[]>([
    { time: '09:41 AM', message: 'Soybean prices drop due to increased supply.' },
    { time: '09:35 AM', message: 'Coffee futures rise with strong demand.' },
  ]);

  const [trends] = useState<CommodityTrend[]>(
    trendsWithHistory.map(item => ({
      ...item,
      price: item.historicalData.price[item.historicalData.price.length - 1],
      status: item.status as 'up' | 'down' | 'stable'
    }))
  );

  const [selectedCommodity, setSelectedCommodity] = useState<typeof trendsWithHistory[0] | null>(null);

  const pieChartData = {
    labels: trends.map(item => item.name),
    datasets: [
      {
        data: trends.map(item => Math.abs(item.trend)),
        backgroundColor: ['#10B981', '#EF4444', '#F59E0B'],
        borderWidth: 0,
      },
    ],
  };

  const handleChartClick = (event: ChartEvent, elements: ActiveElement[]) => {
    if (elements.length > 0) {
      const index = elements[0].index;
      setSelectedCommodity(trendsWithHistory[index]);
    }
  };

  return (
    <>
      {/* SEO Optimization */}
      <Head>
        <title>Fotis Agro Trading Platform</title>
        <meta name="description" content="Trade commodities with real-time updates on Fotis Agro." />
        <meta name="keywords" content="commodity trading, soybeans, coffee, maize" />
      </Head>

      <div className={`min-h-screen ${
        theme === 'dark' ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'
      }`}>
        {/* Welcome Section */}
        <div className={`py-20 ${
          theme === 'dark' ? 'bg-gray-800' : 'bg-white'
        }`}>
          <div className="max-w-7xl mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Welcome to Fotis Agro Trading
            </h1>
            <p className="text-lg md:text-xl mb-8">
              Your trusted platform for real-time commodity trading.
            </p>
            <Link href="/signup">
              <button className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition">
                Get Started
              </button>
            </Link>
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
                        {item.name}: {currencyFormatter.format(item.price)}
                      </span>
                      <span className={`ml-2 ${
                        item.status === 'up' ? 'text-green-600' : 'text-red-500'
                      } font-semibold`}>
                        {item.trend > 0 ? '+' : ''}{item.trend} ({item.change})
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

        {/* Pie Chart Section */}
        <div className="max-w-4xl mx-auto px-4 mb-12">
          <div className={`p-6 rounded-xl shadow-lg ${
            theme === 'dark' ? 'bg-gray-800' : 'bg-white'
          }`}>
            <h2 className="text-2xl font-semibold mb-4">Market Trends</h2>
            <Pie data={pieChartData} options={chartOptions} onClick={(event) => {
              const chartEvent = {
                native: event,
                x: event.clientX,
                y: event.clientY,
                type: 'click'
              };
              const activeElements = pieChartData.datasets.map((dataset, datasetIndex) => {
                const targetElement = event.target as HTMLElement;
                const index = dataset.data.indexOf(Number(targetElement.getAttribute('data-index')));
                return {
                  datasetIndex: datasetIndex,
                  index: index,
                  element: {
                    width: 0,
                    height: 0,
                  }
                };
              });
            }} />
          </div>
        </div>

        {/* Commodity Details Popup */}
        {selectedCommodity && (
          <CommodityDetailsPopup
            commodity={{
              ...selectedCommodity,
              status: selectedCommodity.status as "down" | "up" | "stable",
              historicalData: {
                price: selectedCommodity.historicalData.price,
                demand: [],
                supply: [],
                labels: []
              }
            }}
            onClose={() => setSelectedCommodity(null)}
          />
        )}
      </div>
    </>
  );
}