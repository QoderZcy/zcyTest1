// 衣物类别
export enum ClothingCategory {
  UPPER = 'upper',           // 上衣
  LOWER = 'lower',           // 下装
  OUTER = 'outer',           // 外套
  ACCESSORIES = 'accessories', // 配饰
  FOOTWEAR = 'footwear'      // 鞋类
}

// 衣物推荐项
export interface ClothingItem {
  category: ClothingCategory;
  name: string;
  description: string;
  icon: string;
  priority: number; // 推荐优先级
}

// 穿衣建议数据
export interface ClothingRecommendation {
  temperature: number;
  feelsLike: number;
  weatherCondition: string;
  recommendations: ClothingItem[];
  comfortLevel: 'cold' | 'cool' | 'comfortable' | 'warm' | 'hot';
  specialTips: string[];
  lastUpdated: Date;
}

// 舒适度评级
export interface ComfortLevel {
  level: 'cold' | 'cool' | 'comfortable' | 'warm' | 'hot';
  description: string;
  color: string;
  icon: string;
}

// 穿衣建议配置
export interface ClothingConfig {
  temperatureRanges: {
    [key: string]: {
      min: number;
      max: number;
      recommendations: ClothingItem[];
    };
  };
  weatherSpecificItems: {
    [key: string]: ClothingItem[];
  };
}