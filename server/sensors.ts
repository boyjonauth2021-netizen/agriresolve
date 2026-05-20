import type { Plant, SensorReading } from "../shared/types.js";

const appliedPlants = new Set<string>();

export function applyPlantSettings(plantId: string) {
  appliedPlants.add(plantId);
}

function jitter(value: number, range: number): number {
  return Math.round((value + (Math.random() - 0.5) * range) * 100) / 100;
}

export function getSensorReading(
  plantId: string,
  plant?: Plant
): SensorReading | null {
  if (!appliedPlants.has(plantId) || !plant) {
    return null;
  }

  const c = plant.conditions;
  const midPh = (c.phMin + c.phMax) / 2;
  const midEc = (c.ecMin + c.ecMax) / 2;
  const midAir = (c.tempMin + c.tempMax) / 2;
  const midWater = (c.waterTempMin + c.waterTempMax) / 2;
  const midHumidity = (c.humidityMin + c.humidityMax) / 2;

  return {
    plantId,
    airTemp: jitter(midAir, 2),
    waterTemp: jitter(midWater, 1.5),
    ph: jitter(midPh, 0.2),
    ec: jitter(midEc, 0.3),
    humidity: jitter(midHumidity, 5),
    tds: Math.round(midEc * 500 + (Math.random() - 0.5) * 50),
    lightIntensity: Math.round(8000 + Math.random() * 4000),
    pump: Math.random() > 0.3,
    light: true,
    fan: Math.random() > 0.4,
    nutrientPump: Math.random() > 0.5,
    timestamp: new Date().toISOString(),
  };
}
