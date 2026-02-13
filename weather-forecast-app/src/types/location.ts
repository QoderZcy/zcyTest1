// 位置信息类型定义
export interface LocationData {
  id: string;
  name: string;
  nameEn: string;
  country: string;
  province: string;
  latitude: number;
  longitude: number;
  timezone: string;
  isCurrentLocation: boolean;
  isFavorite: boolean;
}

// 城市数据类型
export interface CityData {
  id: string;
  name: string;
  nameEn: string;
  country: string;
  province: string;
  latitude: number;
  longitude: number;
  timezone?: string;
}

// 城市搜索结果
export interface CitySearchResult extends CityData {
  fullName: string;
  matchScore: number;
}