import { HttpClient, createHttpClient } from './httpClient';
import { LocationData, CityData, CitySearchResult, CacheData } from '../types';

// 高德地图API响应接口
interface AmapGeocodeResponse {
  status: string;
  info: string;
  infocode: string;
  count: string;
  geocodes: Array<{
    formatted_address: string;
    country: string;
    province: string;
    citycode: string;
    city: string;
    district: string;
    township: string;
    neighborhood: {
      name: string;
      type: string;
    };
    building: {
      name: string;
      type: string;
    };
    adcode: string;
    street: string;
    number: string;
    location: string;
    level: string;
  }>;
}

// 城市搜索响应
interface AmapSearchResponse {
  status: string;
  info: string;
  infocode: string;
  count: string;
  suggestion: {
    keywords: string[];
    cities: Array<{
      name: string;
      citycode: string;
      adcode: string;
    }>;
  };
  districts: Array<{
    citycode: string;
    adcode: string;
    name: string;
    center: string;
    level: string;
    districts?: Array<{
      citycode: string;
      adcode: string;
      name: string;
      center: string;
      level: string;
    }>;
  }>;
}

export class LocationService {
  private httpClient: HttpClient;
  private cache: Map<string, CacheData<any>> = new Map();
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24小时

  constructor() {
    this.httpClient = createHttpClient({
      baseURL: 'https://restapi.amap.com/v3',
      timeout: 8000,
      retries: 2
    });
  }

  // 获取当前位置
  async getCurrentLocation(): Promise<LocationData> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('浏览器不支持地理定位'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            const locationData = await this.reverseGeocode(latitude, longitude);
            resolve({
              ...locationData,
              isCurrentLocation: true,
              isFavorite: false
            });
          } catch (error) {
            reject(error);
          }
        },
        (error) => {
          switch (error.code) {
            case error.PERMISSION_DENIED:
              reject(new Error('用户拒绝了地理定位请求'));
              break;
            case error.POSITION_UNAVAILABLE:
              reject(new Error('位置信息不可用'));
              break;
            case error.TIMEOUT:
              reject(new Error('获取位置信息超时'));
              break;
            default:
              reject(new Error('获取位置信息失败'));
              break;
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5分钟
        }
      );
    });
  }

  // 逆地理编码
  async reverseGeocode(latitude: number, longitude: number): Promise<LocationData> {
    const cacheKey = `reverse-${latitude}-${longitude}`;
    const cached = this.getFromCache<LocationData>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const params = {
        key: import.meta.env.VITE_AMAP_API_KEY,
        location: `${longitude},${latitude}`,
        poitype: '',
        radius: 1000,
        extensions: 'base',
        batch: false,
        roadlevel: 0
      };

      const response = await this.httpClient.get<AmapGeocodeResponse>('/geocode/regeo', params);
      
      if (response.status !== '1' || !response.geocodes || response.geocodes.length === 0) {
        throw new Error('逆地理编码失败');
      }

      const geocode = response.geocodes[0];
      const locationData = this.transformGeocodeToLocation(geocode, latitude, longitude);
      
      this.setCache(cacheKey, locationData);
      return locationData;
    } catch (error) {
      console.error('逆地理编码失败:', error);
      throw new Error('获取位置信息失败');
    }
  }

  // 搜索城市
  async searchCities(query: string): Promise<CitySearchResult[]> {
    if (!query || query.trim().length < 2) {
      return [];
    }

    const cacheKey = `search-${query}`;
    const cached = this.getFromCache<CitySearchResult[]>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const params = {
        key: import.meta.env.VITE_AMAP_API_KEY,
        keywords: query,
        subdistrict: 2,
        page: 1,
        offset: 20,
        extensions: 'base',
        level: 'city'
      };

      const response = await this.httpClient.get<AmapSearchResponse>('/config/district', params);
      
      if (response.status !== '1') {
        throw new Error('城市搜索失败');
      }

      const results = this.transformSearchResults(response.districts, query);
      
      this.setCache(cacheKey, results);
      return results;
    } catch (error) {
      console.error('城市搜索失败:', error);
      return [];
    }
  }

  // 获取热门城市
  async getPopularCities(): Promise<CityData[]> {
    const cacheKey = 'popular-cities';
    const cached = this.getFromCache<CityData[]>(cacheKey);
    if (cached) {
      return cached;
    }

    // 热门城市列表
    const popularCities: CityData[] = [
      {
        id: 'beijing',
        name: '北京',
        nameEn: 'Beijing',
        country: '中国',
        province: '北京市',
        latitude: 39.9042,
        longitude: 116.4074,
        timezone: 'Asia/Shanghai'
      },
      {
        id: 'shanghai',
        name: '上海',
        nameEn: 'Shanghai',
        country: '中国',
        province: '上海市',
        latitude: 31.2304,
        longitude: 121.4737,
        timezone: 'Asia/Shanghai'
      },
      {
        id: 'guangzhou',
        name: '广州',
        nameEn: 'Guangzhou',
        country: '中国',
        province: '广东省',
        latitude: 23.1291,
        longitude: 113.2644,
        timezone: 'Asia/Shanghai'
      },
      {
        id: 'shenzhen',
        name: '深圳',
        nameEn: 'Shenzhen',
        country: '中国',
        province: '广东省',
        latitude: 22.5431,
        longitude: 114.0579,
        timezone: 'Asia/Shanghai'
      },
      {
        id: 'hangzhou',
        name: '杭州',
        nameEn: 'Hangzhou',
        country: '中国',
        province: '浙江省',
        latitude: 30.2741,
        longitude: 120.1551,
        timezone: 'Asia/Shanghai'
      },
      {
        id: 'nanjing',
        name: '南京',
        nameEn: 'Nanjing',
        country: '中国',
        province: '江苏省',
        latitude: 32.0603,
        longitude: 118.7969,
        timezone: 'Asia/Shanghai'
      },
      {
        id: 'wuhan',
        name: '武汉',
        nameEn: 'Wuhan',
        country: '中国',
        province: '湖北省',
        latitude: 30.5928,
        longitude: 114.3055,
        timezone: 'Asia/Shanghai'
      },
      {
        id: 'chengdu',
        name: '成都',
        nameEn: 'Chengdu',
        country: '中国',
        province: '四川省',
        latitude: 30.5728,
        longitude: 104.0668,
        timezone: 'Asia/Shanghai'
      }
    ];

    this.setCache(cacheKey, popularCities);
    return popularCities;
  }

  // 数据转换方法
  private transformGeocodeToLocation(geocode: any, latitude: number, longitude: number): LocationData {
    const city = geocode.city || geocode.district || geocode.province;
    const province = geocode.province;
    
    return {
      id: `${latitude}-${longitude}`,
      name: city,
      nameEn: this.getEnglishName(city),
      country: '中国',
      province: province,
      latitude,
      longitude,
      timezone: 'Asia/Shanghai',
      isCurrentLocation: false,
      isFavorite: false
    };
  }

  private transformSearchResults(districts: any[], query: string): CitySearchResult[] {
    const results: CitySearchResult[] = [];

    const processDistrict = (district: any, level: number = 0) => {
      if (district.level === 'city' || district.level === 'district') {
        const [longitude, latitude] = district.center.split(',').map(Number);
        const matchScore = this.calculateMatchScore(district.name, query);
        
        if (matchScore > 0) {
          results.push({
            id: district.adcode || `${latitude}-${longitude}`,
            name: district.name,
            nameEn: this.getEnglishName(district.name),
            country: '中国',
            province: this.getProvinceName(district.name),
            latitude,
            longitude,
            timezone: 'Asia/Shanghai',
            fullName: `${district.name}`,
            matchScore
          });
        }
      }

      if (district.districts && district.districts.length > 0) {
        district.districts.forEach((subDistrict: any) => {
          processDistrict(subDistrict, level + 1);
        });
      }
    };

    districts.forEach(district => processDistrict(district));
    
    // 按匹配度排序
    return results
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 10);
  }

  // 计算匹配分数
  private calculateMatchScore(name: string, query: string): number {
    if (name === query) return 100;
    if (name.startsWith(query)) return 90;
    if (name.includes(query)) return 70;
    
    // 拼音匹配等其他逻辑可以在这里添加
    return 0;
  }

  // 获取英文名称（简单映射）
  private getEnglishName(chineseName: string): string {
    const nameMap: { [key: string]: string } = {
      '北京': 'Beijing',
      '上海': 'Shanghai',
      '广州': 'Guangzhou',
      '深圳': 'Shenzhen',
      '杭州': 'Hangzhou',
      '南京': 'Nanjing',
      '武汉': 'Wuhan',
      '成都': 'Chengdu',
      '重庆': 'Chongqing',
      '天津': 'Tianjin',
      '西安': 'Xi\'an',
      '苏州': 'Suzhou',
      '青岛': 'Qingdao',
      '郑州': 'Zhengzhou',
      '大连': 'Dalian',
      '宁波': 'Ningbo',
      '厦门': 'Xiamen'
    };

    return nameMap[chineseName] || chineseName;
  }

  // 获取省份名称
  private getProvinceName(cityName: string): string {
    const provinceMap: { [key: string]: string } = {
      '北京': '北京市',
      '上海': '上海市',
      '天津': '天津市',
      '重庆': '重庆市',
      '广州': '广东省',
      '深圳': '广东省',
      '杭州': '浙江省',
      '南京': '江苏省',
      '武汉': '湖北省',
      '成都': '四川省',
      '西安': '陕西省',
      '青岛': '山东省',
      '大连': '辽宁省',
      '厦门': '福建省'
    };

    return provinceMap[cityName] || '未知';
  }

  // 缓存管理
  private getFromCache<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (cached && cached.expiry > new Date()) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  private setCache<T>(key: string, data: T): void {
    const expiry = new Date(Date.now() + this.CACHE_DURATION);
    this.cache.set(key, { data, timestamp: new Date(), expiry });
  }

  // 清理过期缓存
  clearExpiredCache(): void {
    const now = new Date();
    for (const [key, cached] of this.cache.entries()) {
      if (cached.expiry <= now) {
        this.cache.delete(key);
      }
    }
  }
}

// 导出单例实例
export const locationService = new LocationService();