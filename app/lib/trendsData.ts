export interface CommodityTrend {
  id: string;
  name: string;
  trend: number;
  change: string;
  status: 'up' | 'down';
  price: number;
  historicalData: {
    prices: number[];
    dates: string[];
    volume: string;
  };
  unit: 'ton' | 'bushel' | 'pound';
  history: {
    date: string;
    value: number;
  }[];
  category: 'grains' | 'softs' | 'livestock' | 'energy';
}
export const trendsWithHistory: CommodityTrend[] = [
  {
    id: 'SOY-2024',
    name: 'Soybeans',
    trend: -2.5,
    change: '-2.5%',
    status: 'down',
    price: 2325,
    unit: 'bushel',
    category: 'grains',
    historicalData: {
      prices: [2300, 2350, 2325],
      dates: ['2024-01', '2024-02', '2024-03'],
      volume: '1.2M tons'
    },
    history: [
      { date: '2024-01', value: 2300 },
      { date: '2024-02', value: 2350 },
      { date: '2024-03', value: 2325 }
    ]
  },
  {
    id: 'COFFEE-2024',
    name: 'Coffee',
    trend: 1.8,
    change: '1.8%',
    status: 'up',
    price: 1880,
    unit: 'pound',
    category: 'softs',
    historicalData: {
      prices: [1800, 1850, 1880],
      dates: ['2024-01', '2024-02', '2024-03'],
      volume: '850K tons'
    },
    history: [
      { date: '2024-01', value: 1800 },
      { date: '2024-02', value: 1850 },
      { date: '2024-03', value: 1880 }
    ]
  },
  {
    id: 'SESAME-2024',
    name: 'Sesame',
    trend: 2.5,
    change: '1.8%',
    status: 'up',
    price: 6000,
    unit: 'ton',
    category: 'grains',
    historicalData: {
      prices: [6000, 5500, 6500],
      dates: ['2024-01', '2024-02', '2024-03'],
      volume: '850K tons'
    },
    history: [
      { date: '2024-01', value: 6000 },
      { date: '2024-02', value: 5500 },
      { date: '2024-03', value: 6500 }
    ]
  },
  {
    id: 'SUNFLOWER-2024',
    name: 'Sunflower',
    trend: 1.5,
    change: '2.0%',
    status: 'up',
    price: 1500,
    unit: 'ton',
    category: 'grains',
    historicalData: {
      prices: [1600, 1500, 2000],
      dates: ['2024-01', '2024-02', '2024-03'],
      volume: '850K tons'
    },
    history: [
      { date: '2024-01', value: 1600 },
      { date: '2024-02', value: 1500 },
      { date: '2024-03', value: 2000 }
    ]
  }
];

// Utility function to fetch trend data
export const getTrendData = async (): Promise<CommodityTrend[]> => {
  return new Promise(resolve => {
    setTimeout(() => resolve(trendsWithHistory), 500);
  });
};

// Type guard for commodity categories
export const isCommodityCategory = (
  category: string
): category is CommodityTrend['category'] => {
  return ['grains', 'softs', 'livestock', 'energy'].includes(category);
};

// Type guard for price movement status
export const isPriceStatus = (
  status: string
): status is CommodityTrend['status'] => {
  return ['up', 'down'].includes(status);
};