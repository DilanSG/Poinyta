export type ButtonColorPreset = {
  id: string;
  primary: string;
  primaryActive: string;
  cost: number;
};

export const BUTTON_COLORS: ButtonColorPreset[] = [
  { id: "default", primary: "", primaryActive: "", cost: 5 },
  { id: "crimson", primary: "#C44A4A", primaryActive: "#A83A3A", cost: 5 },
  { id: "ruby", primary: "#C42A3A", primaryActive: "#A81A2A", cost: 5 },
  { id: "wine", primary: "#8A3A4A", primaryActive: "#722A3A", cost: 5 },
  { id: "rose", primary: "#C47A9A", primaryActive: "#A86480", cost: 5 },
  { id: "blush", primary: "#D47A7A", primaryActive: "#BA6262", cost: 5 },
  { id: "cherry", primary: "#D45A6A", primaryActive: "#BA4252", cost: 5 },
  { id: "fuchsia", primary: "#D44A8A", primaryActive: "#B83872", cost: 5 },
  { id: "neon-pink", primary: "#E04A8A", primaryActive: "#C43272", cost: 5 },
  { id: "tangerine", primary: "#D4682A", primaryActive: "#B8541E", cost: 5 },
  { id: "pumpkin", primary: "#D47A3A", primaryActive: "#BA6228", cost: 5 },
  { id: "coral", primary: "#C47A5A", primaryActive: "#A86242", cost: 5 },
  { id: "sunset", primary: "#C48A5A", primaryActive: "#A87042", cost: 5 },
  { id: "peach", primary: "#D4A07A", primaryActive: "#BA8862", cost: 5 },
  { id: "neon-orange", primary: "#E0682A", primaryActive: "#C4521E", cost: 5 },
  { id: "sunset2", primary: "#E08A5A", primaryActive: "#C47242", cost: 5 },
  { id: "clay", primary: "#B07A5A", primaryActive: "#966248", cost: 5 },
  { id: "amber", primary: "#C48A3A", primaryActive: "#A8732E", cost: 5 },
  { id: "gold", primary: "#B59A4A", primaryActive: "#9A7E3A", cost: 5 },
  { id: "honey", primary: "#D4B05A", primaryActive: "#BA9842", cost: 5 },
  { id: "buttercup", primary: "#D4B04A", primaryActive: "#BA9838", cost: 5 },
  { id: "chocolate", primary: "#8A6A4A", primaryActive: "#72523A", cost: 5 },
  { id: "lime", primary: "#6ABA3A", primaryActive: "#54A02E", cost: 5 },
  { id: "neon-green", primary: "#3AE07A", primaryActive: "#2AC462", cost: 5 },
  { id: "emerald", primary: "#3D8B6A", primaryActive: "#2E7354", cost: 5 },
  { id: "mint", primary: "#5AAC8A", primaryActive: "#449270", cost: 5 },
  { id: "jade", primary: "#4A9A7A", primaryActive: "#3A7E62", cost: 5 },
  { id: "forest", primary: "#4A7A5A", primaryActive: "#3A6248", cost: 5 },
  { id: "moss", primary: "#6A8A4A", primaryActive: "#547038", cost: 5 },
  { id: "sage", primary: "#6A9A7A", primaryActive: "#547E62", cost: 5 },
  { id: "teal", primary: "#3A9A9A", primaryActive: "#2E7E7E", cost: 5 },
  { id: "lagoon", primary: "#3AAAB4", primaryActive: "#2E8E96", cost: 5 },
  { id: "aurora", primary: "#3AD4A0", primaryActive: "#2EB888", cost: 5 },
  { id: "cyan", primary: "#3AB4D4", primaryActive: "#2E96B4", cost: 5 },
  { id: "hologram", primary: "#3AB4E0", primaryActive: "#2E96C4", cost: 5 },
  { id: "sky", primary: "#5A9AC4", primaryActive: "#487EA4", cost: 5 },
  { id: "ocean", primary: "#3D7AB5", primaryActive: "#306498", cost: 5 },
  { id: "steel", primary: "#5A7A8A", primaryActive: "#426272", cost: 5 },
  { id: "cobalt", primary: "#2A6AD4", primaryActive: "#1E54B4", cost: 5 },
  { id: "navy", primary: "#2A4A8A", primaryActive: "#1E3A72", cost: 5 },
  { id: "neon-blue", primary: "#3A8AEA", primaryActive: "#2E72C8", cost: 5 },
  { id: "indigo", primary: "#4A5A9A", primaryActive: "#3A487E", cost: 5 },
  { id: "violet", primary: "#7A5ABA", primaryActive: "#6448A0", cost: 5 },
  { id: "lavender", primary: "#8A7ABA", primaryActive: "#7262A0", cost: 5 },
  { id: "lilac", primary: "#A07ABA", primaryActive: "#8862A0", cost: 5 },
  { id: "amethyst", primary: "#8A6AAA", primaryActive: "#725490", cost: 5 },
  { id: "plum", primary: "#7A4A6A", primaryActive: "#623854", cost: 5 },
  { id: "galaxy", primary: "#4A3A8A", primaryActive: "#382872", cost: 5 },
  { id: "cyber", primary: "#D44AD4", primaryActive: "#B838B8", cost: 5 },
  { id: "slate", primary: "#4C6A92", primaryActive: "#3E587A", cost: 5 },
  { id: "pewter", primary: "#6A6A7A", primaryActive: "#545462", cost: 5 },
  { id: "graphite", primary: "#5A5A6A", primaryActive: "#484855", cost: 5 },
  { id: "silver", primary: "#8A8A9A", primaryActive: "#727282", cost: 5 },
  { id: "warm-gray", primary: "#8A807A", primaryActive: "#726862", cost: 5 },
  { id: "charcoal", primary: "#3A3A4A", primaryActive: "#2A2A38", cost: 5 },
  { id: "midnight", primary: "#2A2A4A", primaryActive: "#1E1E3A", cost: 5 },
];

export function getButtonColorById(id: string): ButtonColorPreset | undefined {
  return BUTTON_COLORS.find((b) => b.id === id);
}
