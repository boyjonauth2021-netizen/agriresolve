export interface PlantSummary {
  id: string;
  name: string;
  scientificName: string;
  category: string;
  emoji: string;
  growthDays: number;
}

export interface PlantConditions {
  phMin: number;
  phMax: number;
  tempMin: number;
  tempMax: number;
  lightHoursPerDay: number;
  ecMin: number;
  ecMax: number;
  humidityMin: number;
  humidityMax: number;
  waterTempMin: number;
  waterTempMax: number;
}

export interface PlantNutrients {
  nitrogen: string;
  phosphorus: string;
  potassium: string;
  calcium: string;
  magnesium: string;
}

export interface Plant extends PlantSummary {
  description: string;
  conditions: PlantConditions;
  nutrients: PlantNutrients;
  tips: string[];
}

export interface GrowthDataPoint {
  day: number;
  heightCm: number;
  leafCount: number;
  phLevel: number;
  ecLevel: number;
  stage: string;
}

export interface GrowthData {
  plantId: string;
  totalDays: number;
  stages: string[];
  dataPoints: GrowthDataPoint[];
}

export interface Conversation {
  id: number;
  title: string;
  createdAt: string;
}

export interface Message {
  id: number;
  conversationId: number;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

export interface ConversationDetail extends Conversation {
  messages: Message[];
}

export interface SensorReading {
  plantId: string;
  airTemp?: number;
  waterTemp?: number;
  ph?: number;
  ec?: number;
  humidity?: number;
  tds?: number;
  lightIntensity?: number;
  pump?: boolean;
  light?: boolean;
  fan?: boolean;
  nutrientPump?: boolean;
  timestamp?: string;
}
