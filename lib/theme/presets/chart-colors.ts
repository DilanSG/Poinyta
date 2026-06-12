export type ChartColorPreset = {
  id: string;
  name: string;
  positive: string;
  negative: string;
  cost: number;
};

export const CHART_COLORS: ChartColorPreset[] = [
  { id: "default", name: "Original", positive: "#207a23", negative: "#ce2418", cost: 0 },
  { id: "classic", name: "Brillante", positive: "#4CAF50", negative: "#F44336", cost: 5 },
  { id: "ocean", name: "Ocean", positive: "#2A9D8F", negative: "#E76F51", cost: 5 },
  { id: "spiderman", name: "Spiderman", positive: "#2563EB", negative: "#DC2626", cost: 5 },
  { id: "monochrome", name: "Monocromo", positive: "#FFFFFF", negative: "#000000", cost: 5 },
  { id: "night", name: "Noche", positive: "#F59E0B", negative: "#1E293B", cost: 5 },
  { id: "monster", name: "Monster", positive: "#84CC16", negative: "#9333EA", cost: 5 },
  { id: "sunset", name: "Sunset", positive: "#0EA5E9", negative: "#EA580C", cost: 5 },
  { id: "elegant", name: "Luxury", positive: "#b18e52", negative: "#475569", cost: 5 },
  { id: "neon", name: "Neón", positive: "#10B981", negative: "#DB2777", cost: 5 },
  { id: "lava", name: "Lava", positive: "#06B6D4", negative: "#B45309", cost: 5 },
  { id: "ink", name: "Tinta", positive: "#F5F5F5", negative: "#1A1A1A", cost: 5 },
  { id: "galaxy", name: "Galaxia", positive: "#8B5CF6", negative: "#FDE047", cost: 5 },
  { id: "fire", name: "Fuego", positive: "#FF6B35", negative: "#1E3A8A", cost: 5 },
  { id: "bubble", name: "Aqua", positive: "#2DD4BF", negative: "#030599", cost: 5 },
];

export function getChartColorById(id: string): ChartColorPreset | undefined {
  return CHART_COLORS.find((c) => c.id === id);
}
