import { 
  ClothingRecommendation, 
  ClothingItem, 
  ClothingCategory, 
  WeatherCondition,
  CurrentWeatherData
} from '../types';

// 穿衣建议生成器
export class ClothingRecommendationEngine {
  // 根据天气数据生成穿衣建议
  static generateRecommendation(weatherData: CurrentWeatherData): ClothingRecommendation {
    const { temperature, feelsLike, weather, humidity, windSpeed } = weatherData;
    
    // 计算舒适度指数
    const comfortIndex = this.calculateComfortIndex(temperature, feelsLike, humidity, windSpeed);
    const comfortLevel = this.getComfortLevel(comfortIndex);
    
    // 生成基础衣物建议
    const baseRecommendations = this.getBaseRecommendations(temperature, feelsLike);
    
    // 根据天气条件调整建议
    const weatherAdjustments = this.getWeatherAdjustments(weather);
    
    // 合并建议
    const recommendations = [...baseRecommendations, ...weatherAdjustments];
    
    // 生成特殊提醒
    const specialTips = this.generateSpecialTips(weatherData);
    
    return {
      temperature,
      feelsLike,
      weatherCondition: weather,
      recommendations: this.sortRecommendations(recommendations),
      comfortLevel,
      specialTips,
      lastUpdated: new Date()
    };
  }

  // 计算舒适度指数
  private static calculateComfortIndex(
    temp: number, 
    feelsLike: number, 
    humidity: number, 
    windSpeed: number
  ): number {
    // 基础温度舒适度
    let index = 50; // 中性起点
    
    // 温度影响
    if (temp < 0) index -= 40;
    else if (temp < 10) index -= 20;
    else if (temp < 18) index -= 10;
    else if (temp <= 25) index += 20; // 最舒适区间
    else if (temp <= 30) index += 10;
    else if (temp <= 35) index -= 10;
    else index -= 30;
    
    // 体感温度调整
    const feelsDiff = Math.abs(feelsLike - temp);
    index -= feelsDiff * 2;
    
    // 湿度影响
    if (humidity > 80) index -= 15;
    else if (humidity > 60) index -= 5;
    else if (humidity < 30) index -= 10;
    
    // 风速影响
    if (windSpeed > 25) index -= 10;
    else if (windSpeed > 15) index -= 5;
    
    return Math.max(0, Math.min(100, index));
  }

  // 获取舒适度等级
  private static getComfortLevel(index: number): 'cold' | 'cool' | 'comfortable' | 'warm' | 'hot' {
    if (index >= 70) return 'comfortable';
    if (index >= 50) return 'cool';
    if (index >= 30) return 'cold';
    if (index >= 20) return 'warm';
    return 'hot';
  }

  // 获取基础衣物建议
  private static getBaseRecommendations(temp: number, feelsLike: number): ClothingItem[] {
    const effectiveTemp = feelsLike; // 使用体感温度
    const recommendations: ClothingItem[] = [];

    // 上衣建议
    if (effectiveTemp < -10) {
      recommendations.push({
        category: ClothingCategory.UPPER,
        name: '保暖内衣',
        description: '贴身保暖内衣',
        icon: '🧥',
        priority: 1
      });
      recommendations.push({
        category: ClothingCategory.OUTER,
        name: '羽绒服',
        description: '厚重羽绒服或棉服',
        icon: '🧥',
        priority: 1
      });
    } else if (effectiveTemp < 0) {
      recommendations.push({
        category: ClothingCategory.UPPER,
        name: '毛衣',
        description: '厚毛衣或保暖衣',
        icon: '👕',
        priority: 1
      });
      recommendations.push({
        category: ClothingCategory.OUTER,
        name: '棉衣',
        description: '棉衣或厚外套',
        icon: '🧥',
        priority: 1
      });
    } else if (effectiveTemp < 10) {
      recommendations.push({
        category: ClothingCategory.UPPER,
        name: '长袖衬衫',
        description: '长袖衬衫或薄毛衣',
        icon: '👔',
        priority: 1
      });
      recommendations.push({
        category: ClothingCategory.OUTER,
        name: '夹克',
        description: '薄外套或夹克',
        icon: '🧥',
        priority: 2
      });
    } else if (effectiveTemp < 18) {
      recommendations.push({
        category: ClothingCategory.UPPER,
        name: '长袖T恤',
        description: '长袖T恤或薄衬衫',
        icon: '👕',
        priority: 1
      });
      recommendations.push({
        category: ClothingCategory.OUTER,
        name: '薄外套',
        description: '可选择薄外套',
        icon: '🧥',
        priority: 3
      });
    } else if (effectiveTemp < 25) {
      recommendations.push({
        category: ClothingCategory.UPPER,
        name: '短袖T恤',
        description: '短袖T恤或薄长袖',
        icon: '👕',
        priority: 1
      });
    } else if (effectiveTemp < 30) {
      recommendations.push({
        category: ClothingCategory.UPPER,
        name: '短袖衬衫',
        description: '透气短袖衬衫',
        icon: '👔',
        priority: 1
      });
    } else {
      recommendations.push({
        category: ClothingCategory.UPPER,
        name: '背心',
        description: '轻薄背心或吊带',
        icon: '👔',
        priority: 1
      });
    }

    // 下装建议
    if (effectiveTemp < 0) {
      recommendations.push({
        category: ClothingCategory.LOWER,
        name: '厚裤子',
        description: '厚牛仔裤或保暖裤',
        icon: '👖',
        priority: 1
      });
    } else if (effectiveTemp < 15) {
      recommendations.push({
        category: ClothingCategory.LOWER,
        name: '长裤',
        description: '牛仔裤或休闲裤',
        icon: '👖',
        priority: 1
      });
    } else if (effectiveTemp < 25) {
      recommendations.push({
        category: ClothingCategory.LOWER,
        name: '薄长裤',
        description: '薄长裤或九分裤',
        icon: '👖',
        priority: 1
      });
    } else {
      recommendations.push({
        category: ClothingCategory.LOWER,
        name: '短裤',
        description: '短裤或薄裙子',
        icon: '🩳',
        priority: 1
      });
    }

    // 鞋类建议
    if (effectiveTemp < 0) {
      recommendations.push({
        category: ClothingCategory.FOOTWEAR,
        name: '保暖靴',
        description: '保暖雪地靴或厚靴子',
        icon: '🥾',
        priority: 1
      });
    } else if (effectiveTemp < 15) {
      recommendations.push({
        category: ClothingCategory.FOOTWEAR,
        name: '靴子',
        description: '皮靴或运动鞋',
        icon: '👟',
        priority: 2
      });
    } else {
      recommendations.push({
        category: ClothingCategory.FOOTWEAR,
        name: '运动鞋',
        description: '透气运动鞋或休闲鞋',
        icon: '👟',
        priority: 2
      });
    }

    return recommendations;
  }

  // 根据天气条件获取调整建议
  private static getWeatherAdjustments(weather: WeatherCondition): ClothingItem[] {
    const adjustments: ClothingItem[] = [];

    switch (weather) {
      case WeatherCondition.LIGHT_RAIN:
      case WeatherCondition.MODERATE_RAIN:
      case WeatherCondition.HEAVY_RAIN:
        adjustments.push({
          category: ClothingCategory.ACCESSORIES,
          name: '雨具',
          description: '雨伞或雨衣',
          icon: '☂️',
          priority: 1
        });
        adjustments.push({
          category: ClothingCategory.FOOTWEAR,
          name: '防水鞋',
          description: '防水鞋或雨靴',
          icon: '🥾',
          priority: 1
        });
        break;

      case WeatherCondition.LIGHT_SNOW:
      case WeatherCondition.MODERATE_SNOW:
      case WeatherCondition.HEAVY_SNOW:
        adjustments.push({
          category: ClothingCategory.ACCESSORIES,
          name: '保暖配饰',
          description: '帽子、手套、围巾',
          icon: '🧤',
          priority: 1
        });
        adjustments.push({
          category: ClothingCategory.FOOTWEAR,
          name: '防滑鞋',
          description: '防滑雪地靴',
          icon: '🥾',
          priority: 1
        });
        break;

      case WeatherCondition.WIND:
        adjustments.push({
          category: ClothingCategory.OUTER,
          name: '防风衣',
          description: '防风外套',
          icon: '🧥',
          priority: 2
        });
        break;

      case WeatherCondition.FOG:
      case WeatherCondition.HAZE:
        adjustments.push({
          category: ClothingCategory.ACCESSORIES,
          name: '口罩',
          description: '防雾霾口罩',
          icon: '😷',
          priority: 2
        });
        break;

      case WeatherCondition.CLEAR_DAY:
      case WeatherCondition.PARTLY_CLOUDY_DAY:
        adjustments.push({
          category: ClothingCategory.ACCESSORIES,
          name: '防晒用品',
          description: '太阳镜、防晒霜',
          icon: '🕶️',
          priority: 3
        });
        break;
    }

    return adjustments;
  }

  // 生成特殊提醒
  private static generateSpecialTips(weatherData: CurrentWeatherData): string[] {
    const tips: string[] = [];
    const { temperature, feelsLike, weather, uvIndex, humidity, windSpeed } = weatherData;

    // 温度相关提醒
    if (feelsLike - temperature > 5) {
      tips.push('体感温度比实际温度高，注意防暑降温');
    } else if (temperature - feelsLike > 5) {
      tips.push('体感温度比实际温度低，注意保暖');
    }

    // 极端温度提醒
    if (temperature > 35) {
      tips.push('高温天气，尽量避免长时间户外活动');
    } else if (temperature < -10) {
      tips.push('严寒天气，外出请做好保暖措施');
    }

    // 紫外线提醒
    if (uvIndex > 7) {
      tips.push('紫外线强烈，外出请做好防晒');
    }

    // 湿度提醒
    if (humidity > 80) {
      tips.push('湿度较高，选择透气性好的衣物');
    } else if (humidity < 30) {
      tips.push('空气干燥，注意补水和保湿');
    }

    // 风速提醒
    if (windSpeed > 20) {
      tips.push('风力较大，外出注意防风');
    }

    // 天气相关提醒
    switch (weather) {
      case WeatherCondition.THUNDERSTORM:
        tips.push('雷雨天气，避免在空旷地带停留');
        break;
      case WeatherCondition.HEAVY_RAIN:
        tips.push('大雨天气，出行请注意安全');
        break;
      case WeatherCondition.HEAVY_SNOW:
        tips.push('大雪天气，路面湿滑请小心');
        break;
      case WeatherCondition.FOG:
        tips.push('雾天能见度低，出行请注意安全');
        break;
      case WeatherCondition.HAZE:
        tips.push('雾霾天气，建议减少户外活动');
        break;
    }

    return tips;
  }

  // 排序推荐项
  private static sortRecommendations(recommendations: ClothingItem[]): ClothingItem[] {
    return recommendations.sort((a, b) => {
      // 先按优先级排序
      if (a.priority !== b.priority) {
        return a.priority - b.priority;
      }
      // 再按类别排序
      const categoryOrder = [
        ClothingCategory.UPPER,
        ClothingCategory.LOWER,
        ClothingCategory.OUTER,
        ClothingCategory.FOOTWEAR,
        ClothingCategory.ACCESSORIES
      ];
      return categoryOrder.indexOf(a.category) - categoryOrder.indexOf(b.category);
    });
  }

  // 获取舒适度描述
  static getComfortDescription(level: string): { text: string; color: string; icon: string } {
    const descriptions = {
      cold: { text: '偏冷', color: '#2196F3', icon: '🥶' },
      cool: { text: '凉爽', color: '#4CAF50', icon: '😊' },
      comfortable: { text: '舒适', color: '#4CAF50', icon: '😌' },
      warm: { text: '偏热', color: '#FF9800', icon: '😅' },
      hot: { text: '炎热', color: '#F44336', icon: '🥵' }
    };
    
    return descriptions[level as keyof typeof descriptions] || descriptions.comfortable;
  }
}