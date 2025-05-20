import React from 'react';
import { CommodityType } from '../../hooks/useBlockchain';

interface CommodityInfoProps {
  commodity: CommodityType;
  balance: string;
  price: string;
  quality: string;
}

const CommodityInfo: React.FC<CommodityInfoProps> = ({
  commodity,
  balance,
  price,
  quality
}) => {
  const getCommodityIcon = (type: CommodityType) => {
    switch (type) {
      case 'Coffee-Robusta':
      case 'Coffee-Arabica':
        return '☕';
      case 'Cocoa':
        return '🍫';
      case 'Sesame':
        return '🌱';
      case 'Sunflower':
        return '🌻';
      default:
        return '📦';
    }
  };

  const getQualityLabel = (qualityScore: number) => {
    if (qualityScore >= 90) return 'Excellent';
    if (qualityScore >= 75) return 'Good';
    if (qualityScore >= 60) return 'Average';
    if (qualityScore >= 40) return 'Fair';
    return 'Poor';
  };

  const getQualityColor = (qualityScore: number) => {
    if (qualityScore >= 90) return 'text-green-600';
    if (qualityScore >= 75) return 'text-green-500';
    if (qualityScore >= 60) return 'text-yellow-500';
    if (qualityScore >= 40) return 'text-orange-500';
    return 'text-red-500';
  };

  const qualityScore = parseInt(quality);
  const qualityLabel = getQualityLabel(qualityScore);
  const qualityColor = getQualityColor(qualityScore);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center mb-4">
        <span className="text-3xl mr-3">{getCommodityIcon(commodity)}</span>
        <h2 className="text-xl font-semibold">{commodity}</h2>
      </div>
      
      <div className="space-y-4">
        <div>
          <p className="text-sm text-gray-500">Your Balance</p>
          <p className="text-lg font-medium">{parseFloat(balance).toFixed(6)} tokens</p>
        </div>
        
        <div>
          <p className="text-sm text-gray-500">Current Price</p>
          <p className="text-lg font-medium">${parseFloat(price).toFixed(2)} USD</p>
        </div>
        
        <div>
          <p className="text-sm text-gray-500">Quality Score</p>
          <div className="flex items-center">
            <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2">
              <div 
                className="bg-green-600 h-2.5 rounded-full" 
                style={{ width: `${qualityScore}%` }}
              ></div>
            </div>
            <span className={`text-sm font-medium ${qualityColor}`}>
              {qualityScore}/100 ({qualityLabel})
            </span>
          </div>
        </div>
        
        <div>
          <p className="text-sm text-gray-500">Total Value</p>
          <p className="text-lg font-medium">
            ${(parseFloat(balance) * parseFloat(price)).toFixed(2)} USD
          </p>
        </div>
      </div>
    </div>
  );
};

export default CommodityInfo;
