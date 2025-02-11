export type Commodity = {
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