import { useState, useEffect, useCallback } from 'react';
import { ClothingRecommendation, CurrentWeatherData } from '../types';
import { ClothingRecommendationEngine } from '../utils';

export const useClothingRecommendation = (weatherData: CurrentWeatherData | null) => {
  const [recommendation, setRecommendation] = useState<ClothingRecommendation | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // 生成穿衣建议
  const generateRecommendation = useCallback((weather: CurrentWeatherData) => {
    setIsLoading(true);
    try {
      const recommendation = ClothingRecommendationEngine.generateRecommendation(weather);
      setRecommendation(recommendation);
    } catch (error) {
      console.error('生成穿衣建议失败:', error);
      setRecommendation(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 获取舒适度描述
  const getComfortDescription = useCallback(() => {
    if (!recommendation) return null;
    return ClothingRecommendationEngine.getComfortDescription(recommendation.comfortLevel);
  }, [recommendation]);

  // 当天气数据变化时重新生成建议
  useEffect(() => {
    if (weatherData) {
      generateRecommendation(weatherData);
    }
  }, [weatherData, generateRecommendation]);

  return {
    recommendation,
    isLoading,
    generateRecommendation,
    getComfortDescription
  };
};