export type MovementLayerPreset = {
  id: string;
  name: string;
  type: "temblor" | "marea" | "cabeceo" | "respiro" | "vagar" | "zoom" | "elastico" | "balanceo" | "onda" | "latido" | "girar" | "flotar" | "rebote" | "pendulo";
  colors: string[];
  speed: number;
  cost: number;
};

export const MOVEMENT_LAYERS: MovementLayerPreset[] = [
  { id: "none", name: "Sin movimiento", type: "temblor", colors: [], speed: 0, cost: 0 },
  { id: "temblor", name: "Temblor", type: "temblor", colors: ["#E8D5B7", "#C4A882"], speed: 1, cost: 5 },
  { id: "marea", name: "Marea", type: "marea", colors: ["#4A90D9", "#7DB3E6"], speed: 1, cost: 5 },
  { id: "cabeceo", name: "Cabeceo", type: "cabeceo", colors: ["#8B7355", "#A0896E"], speed: 1, cost: 5 },
  { id: "respiro", name: "Respiro", type: "respiro", colors: ["#6BBF8A", "#8FD4A8"], speed: 1, cost: 5 },
  { id: "vagar", name: "Vagar", type: "vagar", colors: ["#B8A9C9", "#D4C9E0"], speed: 1, cost: 5 },
  { id: "zoom", name: "Zoom", type: "zoom", colors: ["#E06C75", "#BE5046"], speed: 1, cost: 8 },
  { id: "elastico", name: "Elástico", type: "elastico", colors: ["#61AFEF", "#2C7DD9"], speed: 1, cost: 8 },
  { id: "balanceo", name: "Balanceo", type: "balanceo", colors: ["#E5C07B", "#D19A66"], speed: 1, cost: 8 },
  { id: "onda", name: "Onda", type: "onda", colors: ["#98C379", "#7CB342"], speed: 1, cost: 8 },
  { id: "latido", name: "Latido", type: "latido", colors: ["#C678DD", "#A359C9"], speed: 1, cost: 8 },
  { id: "girar", name: "Girar", type: "girar", colors: ["#D4A574", "#B8834A"], speed: 1, cost: 8 },
  { id: "flotar", name: "Flotar", type: "flotar", colors: ["#A8D8EA", "#7BC4D4"], speed: 1, cost: 8 },
  { id: "rebote", name: "Rebote", type: "rebote", colors: ["#F0A08A", "#E0785A"], speed: 1, cost: 8 },
  { id: "pendulo", name: "Péndulo", type: "pendulo", colors: ["#B8A8D4", "#9680B8"], speed: 1, cost: 8 },
];

export function getMovementLayerById(id: string): MovementLayerPreset | undefined {
  return MOVEMENT_LAYERS.find((m) => m.id === id);
}
