export interface UrlRecord {
  id: string;
  originalUrl: string;
  alias: string;
  title: string;
  description?: string;
  tags?: string[];
  isCustom: boolean;
  isActive: boolean;
  password?: string;
  expiresAt?: string | null;
  createdAt: string;
  updatedAt: string;
  clicksCount: number;
}

export interface ClickEvent {
  id: string;
  urlId: string;
  timestamp: string;
  ip: string;
  userAgent?: string;
  referer: string;
  country: string;
  countryCode: string;
  city?: string;
  deviceType: 'desktop' | 'mobile' | 'tablet' | 'bot';
  browser: string;
  os: string;
  status: number;
}

export interface DistributionItem {
  label: string;
  count: number;
  percentage: number;
}

export interface TimelineDataPoint {
  date: string;
  clicks: number;
}

export interface AnalyticsSummary {
  alias: string;
  originalUrl: string;
  title: string;
  createdAt: string;
  totalClicks: number;
  uniqueVisitors: number;
  timeline: TimelineDataPoint[];
  devices: DistributionItem[];
  browsers: DistributionItem[];
  operatingSystems: DistributionItem[];
  countries: DistributionItem[];
  referrers: DistributionItem[];
  recentClicks: ClickEvent[];
}

export interface BackendConfig {
  mode: 'local' | 'ec2';
  apiUrl: string;
  isHealthy: boolean;
  lastChecked?: string;
}
