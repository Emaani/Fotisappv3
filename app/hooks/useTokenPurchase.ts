import  { useState} from 'react';

export const useTokenPurchase = () => {
  const [purchaseSuccess, setPurchaseSuccess] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const purchaseTokens = async (amount: number) => {
    setLoading(true);
    setError(null);
    try {
      // Simulate API call for purchasing tokens
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Hardcoded success for demonstration
      if (amount > 0) {
        setPurchaseSuccess(true);
      } else {
        throw new Error('Invalid purchase amount');
      }
    } catch (error: unknown) {
      setPurchaseSuccess(false);
      setError(
        (error instanceof Error && error.message) || 
        (typeof error === 'object' && error !== null && 
         'response' in error && 
         typeof error.response === 'object' && error.response !== null &&
         'data' in error.response &&
         typeof error.response.data === 'object' && error.response.data !== null &&
         'message' in error.response.data &&
         typeof error.response.data.message === 'string' ?
         error.response.data.message : 'An error occurred during the purchase')
      );
    } finally {
      setLoading(false);
    }
  };

  const resetPurchaseStatus = () => {
    setPurchaseSuccess(false);
    setError(null);
  };

  return { purchaseSuccess, loading, error, purchaseTokens, resetPurchaseStatus };
};
