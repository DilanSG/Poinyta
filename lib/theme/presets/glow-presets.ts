export type GlowPreset = {
  id: string;
  color: string;
  name: string;
  cost: number;
};

export const GLOW_PRESETS: GlowPreset[] = [
  { id: "none", color: "transparent", name: "Sin brillo", cost: 0 },
  { id: "auto", color: "auto", name: "Adaptable", cost: 50 },
  { id: "red", color: "#E74C3C", name: "Rojo", cost: 5 },
  { id: "rose", color: "#E91E63", name: "Rosa intenso", cost: 5 },
  { id: "pink", color: "#FF6B9D", name: "Rosa", cost: 5 },
  { id: "coral", color: "#FF7043", name: "Coral", cost: 5 },
  { id: "peach", color: "#FFCCBC", name: "Durazno", cost: 5 },
  { id: "orange", color: "#FF9800", name: "Naranja", cost: 5 },
  { id: "amber", color: "#FFC107", name: "Ámbar", cost: 5 },
  { id: "gold", color: "#FFD700", name: "Dorado", cost: 5 },
  { id: "yellow", color: "#FFEB3B", name: "Amarillo", cost: 5 },
  { id: "green", color: "#3DDC84", name: "Verde", cost: 5 },
  { id: "lime", color: "#CDDC39", name: "Lima", cost: 5 },
  { id: "mint", color: "#4DB6AC", name: "Menta", cost: 5 },
  { id: "teal", color: "#009688", name: "Teal", cost: 5 },
  { id: "cyan", color: "#00BCD4", name: "Cian", cost: 5 },
  { id: "sky", color: "#03A9F4", name: "Celeste", cost: 5 },
  { id: "blue", color: "#4A90D9", name: "Azul", cost: 5 },
  { id: "indigo", color: "#3F51B5", name: "Índigo", cost: 5 },
  { id: "steel", color: "#607D8B", name: "Acero", cost: 5 },
  { id: "purple", color: "#9B59B6", name: "Púrpura", cost: 5 },
  { id: "violet", color: "#673AB7", name: "Violeta", cost: 5 },
  { id: "lavender", color: "#B39DDB", name: "Lavanda", cost: 5 },
  { id: "brown", color: "#795548", name: "Marrón", cost: 5 },
  { id: "chocolate", color: "#8D6E63", name: "Chocolate", cost: 5 },
  { id: "white", color: "#FFFFFF", name: "Blanco", cost: 5 },
  { id: "grey", color: "#9E9E9E", name: "Gris", cost: 5 },
  { id: "black", color: "#212121", name: "Negro", cost: 5 },
];

export function getGlowById(id: string): GlowPreset | undefined {
  return GLOW_PRESETS.find((g) => g.id === id);
}
