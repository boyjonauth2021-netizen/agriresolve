import type { GrowthData, Plant } from "../shared/types.js";

const STAGES = [
  "Germination",
  "Seedling",
  "Vegetative",
  "Flowering/Fruiting",
  "Harvest",
];

export function generateGrowthData(plant: Plant): GrowthData {
  const { growthDays, conditions } = plant;
  const dataPoints = [];
  const sampleDays = [
    1,
    Math.round(growthDays * 0.1),
    Math.round(growthDays * 0.2),
    Math.round(growthDays * 0.3),
    Math.round(growthDays * 0.45),
    Math.round(growthDays * 0.6),
    Math.round(growthDays * 0.75),
    growthDays,
  ];
  const uniqueDays = [...new Set(sampleDays)].sort((a, b) => a - b);

  for (const day of uniqueDays) {
    const progress = day / growthDays;
    const stageIndex = Math.min(
      STAGES.length - 1,
      Math.floor(progress * STAGES.length)
    );
    const heightCm = Math.round((5 + progress * progress * 80) * 10) / 10;
    const leafCount = Math.max(2, Math.round(2 + progress * 14));
    const phLevel =
      Math.round(
        ((conditions.phMin + conditions.phMax) / 2 +
          (Math.random() - 0.5) * 0.15) *
          100
      ) / 100;
    const ecLevel =
      Math.round(
        (conditions.ecMin +
          (conditions.ecMax - conditions.ecMin) * Math.min(1, progress * 1.2) +
          (Math.random() - 0.5) * 0.2) *
          100
      ) / 100;

    dataPoints.push({
      day,
      heightCm,
      leafCount,
      phLevel,
      ecLevel,
      stage: STAGES[stageIndex],
    });
  }

  return {
    plantId: plant.id,
    totalDays: growthDays,
    stages: STAGES,
    dataPoints,
  };
}
