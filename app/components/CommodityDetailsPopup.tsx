'use client';

import React from 'react';
import { Line } from 'react-chartjs-2';
import { useTheme } from '../providers/ThemeProvider';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import type { Commodity } from '@/types/index';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface CommodityDetailsPopupProps {
  commodity: Commodity;
  onClose: () => void;
}

export default function CommodityDetailsPopup({ commodity }: CommodityDetailsPopupProps) {
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
            weight: 'bold' as const,
          }
        }
      },
      tooltip: {
        mode: 'index' as const,
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

  // Rest of the component remains the same...
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 px-4">
      {/* Previous implementation remains unchanged */}
      <div className="h-[400px] mb-6">
        <Line data={chartData} options={chartOptions} />
      </div>
      {/* Rest of the component */}
    </div>
  );
}