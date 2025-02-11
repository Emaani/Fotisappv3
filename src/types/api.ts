export interface WalletResponse {
  success: boolean;
  balance: number;
  currency: string;
}

export interface TradeResponse {
  success: boolean;
  newBalance: number;
}

export interface TokenPurchaseResponse {
  success: boolean;
  tokens: number;
  newBalance: number;
} 