export interface Commodity {
  name: string;
  trend: number;
  change: string;
  status: 'up' | 'down' | 'stable';
  historicalData: {
    price: number[];
    demand: number[];
    supply: number[];
    labels: string[];
  };
} 