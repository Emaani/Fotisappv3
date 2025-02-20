export interface WalletResponse {
  success: boolean;
  balance: number;
  currency: string;
}

export interface TradeResponse {
  success: boolean;
  message: string;
  newBalance: number;
}

export interface TokenPurchaseResponse {
  success: boolean;
  message: string;
  newBalance: number;
} 