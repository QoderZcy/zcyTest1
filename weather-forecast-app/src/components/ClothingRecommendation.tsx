import React from 'react';
import { Shirt, Info } from 'lucide-react';
import { ClothingCategory } from '../types';
import { useWeatherContext } from '../contexts';
import { ClothingRecommendationEngine } from '../utils';

interface ClothingRecommendationProps {
  className?: string;
}

export const ClothingRecommendation: React.FC<ClothingRecommendationProps> = ({ className = '' }) => {
  const { clothingRecommendation, currentWeather, isLoading } = useWeatherContext();

  if (isLoading && !clothingRecommendation) {
    return (
      <div className={`bg-white rounded-2xl p-6 shadow-lg ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="h-20 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!clothingRecommendation) {
    return (
      <div className={`bg-white rounded-2xl p-6 shadow-lg ${className}`}>
        <div className="text-center text-gray-500">
          <Shirt className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>暂无穿衣建议</p>
        </div>
      </div>
    );
  }

  const comfortDescription = ClothingRecommendationEngine.getComfortDescription(clothingRecommendation.comfortLevel);

  return (
    <div className={`bg-white rounded-2xl p-6 shadow-lg ${className}`}>
      {/* 标题和舒适度 */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center">
          <Shirt className="w-5 h-5 mr-2" />
          穿衣建议
        </h3>
        <div className="flex items-center space-x-2">
          <span className="text-2xl">{comfortDescription.icon}</span>
          <span 
            className="text-sm font-medium px-2 py-1 rounded-full"
            style={{ 
              color: comfortDescription.color,
              backgroundColor: `${comfortDescription.color}20`
            }}
          >
            {comfortDescription.text}
          </span>
        </div>
      </div>

      {/* 温度信息 */}
      <div className="bg-gray-50 rounded-lg p-3 mb-4">
        <div className="flex justify-between text-sm">
          <span>当前温度: {clothingRecommendation.temperature}°C</span>
          <span>体感温度: {clothingRecommendation.feelsLike}°C</span>
        </div>
      </div>

      {/* 穿衣推荐 */}
      <div className="space-y-3 mb-4">
        {Object.entries(groupRecommendationsByCategory(clothingRecommendation.recommendations))
          .map(([category, items]) => (
            <ClothingCategorySection 
              key={category} 
              category={category as ClothingCategory} 
              items={items} 
            />
          ))}
      </div>

      {/* 特殊提醒 */}
      {clothingRecommendation.specialTips.length > 0 && (
        <div className="border-t pt-4">
          <div className="flex items-center mb-2">
            <Info className="w-4 h-4 mr-2 text-blue-500" />
            <span className="text-sm font-medium text-blue-700">温馨提醒</span>
          </div>
          <ul className="space-y-1">
            {clothingRecommendation.specialTips.map((tip, index) => (
              <li key={index} className="text-sm text-gray-600 pl-4 relative">
                <span className="absolute left-0 top-1 w-1 h-1 bg-blue-400 rounded-full"></span>
                {tip}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

// 服装类别组件
interface ClothingCategorySectionProps {
  category: ClothingCategory;
  items: any[];
}

const ClothingCategorySection: React.FC<ClothingCategorySectionProps> = ({ category, items }) => {
  const categoryNames = {
    [ClothingCategory.UPPER]: '上衣',
    [ClothingCategory.LOWER]: '下装',
    [ClothingCategory.OUTER]: '外套',
    [ClothingCategory.FOOTWEAR]: '鞋类',
    [ClothingCategory.ACCESSORIES]: '配饰'
  };

  return (
    <div className="flex items-start space-x-3">
      <div className="text-sm font-medium text-gray-700 min-w-[48px]">
        {categoryNames[category]}
      </div>
      <div className="flex-1">
        <div className="flex flex-wrap gap-2">
          {items.map((item, index) => (
            <div 
              key={index}
              className="flex items-center space-x-1 bg-blue-50 text-blue-700 px-2 py-1 rounded-lg text-sm"
            >
              <span>{item.icon}</span>
              <span>{item.name}</span>
            </div>
          ))}
        </div>
        {items.length > 0 && items[0].description && (
          <div className="text-xs text-gray-500 mt-1">
            {items[0].description}
          </div>
        )}
      </div>
    </div>
  );
};

// 工具函数：按类别分组推荐
function groupRecommendationsByCategory(recommendations: any[]) {
  return recommendations.reduce((groups, item) => {
    const category = item.category;
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(item);
    return groups;
  }, {} as Record<ClothingCategory, any[]>);
}