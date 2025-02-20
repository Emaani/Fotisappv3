declare module '@/types/api' {
  export interface TradeResponse {
    success: boolean;
    newBalance: number;
  }
  
  export interface TokenPurchaseResponse {
    success: boolean;
    newBalance: number;
  }

  export interface WalletResponse {
    success: boolean;
    balance: number;
    currency: string;
  }
} 