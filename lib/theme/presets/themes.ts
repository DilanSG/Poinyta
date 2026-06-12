import { LIGHT, DARK } from "../colors";

export type ThemeVariant = {
  id: string;
  name: string;
  description: string;
  cost: number;
  lightOverrides: Partial<typeof LIGHT>;
  darkOverrides: Partial<typeof DARK>;
};

export const THEMES: ThemeVariant[] = [
  { id: "default", name: "Default", description: "Tema original", cost: 0, lightOverrides: {}, darkOverrides: {} },

  { id: "monochrome", name: "Monochrome", description: "Blanco y negro", cost: 50,
    lightOverrides: { primary: "#6A6A6A", accentBlue: "#8A8A8A", success: "#5A5A5A", warning: "#7A7A7A", error: "#6A6A6A", background: "#F5F5F5", surface: "#FCFCFC", border: "#D0D0D0", textPrimary: "#1A1A1A", textSecondary: "#6A6A6A" },
    darkOverrides: { primary: "#B0B0B0", accentBlue: "#C8C8C8", success: "#A0A0A0", warning: "#B8B8B8", error: "#B0B0B0", background: "#121212", surface: "#1E1E1E", border: "#353535", textPrimary: "#E8E8E8", textSecondary: "#A0A0A0" } },
  { id: "slate", name: "Slate", description: "Gris neutro", cost: 50,
    lightOverrides: { primary: "#6A7A8A", accentBlue: "#8A9AAA", success: "#6A8A7A", warning: "#B5A06A", error: "#B87A7A", background: "#F0F2F4", surface: "#F6F8FA", border: "#D0D5DA", textPrimary: "#2A3038", textSecondary: "#5A6A78" },
    darkOverrides: { primary: "#8A9AAA", accentBlue: "#AAB4C0", success: "#7A9A8A", warning: "#C5B07A", error: "#C48A8A", background: "#1A1E24", surface: "#242830", border: "#384048", textPrimary: "#E8ECF0", textSecondary: "#A8B0BA" } },
  { id: "graphite", name: "Graphite", description: "Grafito oscuro", cost: 50,
    lightOverrides: { primary: "#4A4A5A", accentBlue: "#6A6A7A", success: "#4A6A5A", warning: "#9A9A6A", error: "#9A5A5A", background: "#EEF0F2", surface: "#F4F6F8", border: "#C8CCD0", textPrimary: "#22222A", textSecondary: "#5A5A6A" },
    darkOverrides: { primary: "#6A6A7A", accentBlue: "#8A8A9A", success: "#5A7A6A", warning: "#AAAA7A", error: "#AA6A6A", background: "#141418", surface: "#1E1E22", border: "#323238", textPrimary: "#E8E8EE", textSecondary: "#A8A8B2" } },

  { id: "steel", name: "Steel", description: "Acero azulado", cost: 50,
    lightOverrides: { primary: "#5A7A8A", accentBlue: "#7A9AAA", success: "#5A8A7A", warning: "#B5A06A", error: "#B87A7A", background: "#F0F4F5", surface: "#F6F8FA", border: "#D0D8DC", textPrimary: "#2A3438", textSecondary: "#5A6A72" },
    darkOverrides: { primary: "#7A9AAA", accentBlue: "#9AB4C0", success: "#6A9A8A", warning: "#C5B07A", error: "#C48A8A", background: "#1A1E22", surface: "#24282E", border: "#384248", textPrimary: "#E8ECF0", textSecondary: "#A8B2BA" } },
  { id: "sky", name: "Sky", description: "Cielo azulado", cost: 50,
    lightOverrides: { primary: "#5A9AC4", accentBlue: "#7AB4D4", success: "#5A9A8A", warning: "#B5A06A", error: "#B87A7A", background: "#F0F4F7", surface: "#F6FAFC", border: "#D0D8E0", textPrimary: "#2A3440", textSecondary: "#5A7A8A" },
    darkOverrides: { primary: "#7AB4D4", accentBlue: "#9AC8E0", success: "#6AAA9A", warning: "#C5B07A", error: "#C48A8A", background: "#1A222A", surface: "#22303A", border: "#384850", textPrimary: "#E8F0F4", textSecondary: "#A8BAC8" } },
  { id: "arctic", name: "Arctic", description: "Hielo azulado", cost: 50,
    lightOverrides: { primary: "#5A9AD4", accentBlue: "#7ABCE0", success: "#5A9A9A", warning: "#B5A06A", error: "#B87A7A", background: "#F0F6FA", surface: "#F6FAFC", border: "#D0DDE8", textPrimary: "#2A3845", textSecondary: "#5A7A8A" },
    darkOverrides: { primary: "#7ABCE0", accentBlue: "#9ACCE8", success: "#6AAAAA", warning: "#C5B07A", error: "#C48A8A", background: "#18202A", surface: "#22303A", border: "#384850", textPrimary: "#E8F0F8", textSecondary: "#A8BAC8" } },
  { id: "frost", name: "Frost", description: "Escarcha azul", cost: 50,
    lightOverrides: { primary: "#8AB4D4", accentBlue: "#A8CCE4", success: "#7AB4A0", warning: "#C5B08A", error: "#C48A8A", background: "#F4F8FC", surface: "#FAFCFE", border: "#D8E4EC", textPrimary: "#2A3A4A", textSecondary: "#6A8AA0" },
    darkOverrides: { primary: "#9AC0DC", accentBlue: "#B4D4EA", success: "#8AC0AA", warning: "#CCBA8A", error: "#C88A8A", background: "#18222E", surface: "#22303E", border: "#38485A", textPrimary: "#E8F2F8", textSecondary: "#A8BCCE" } },
  { id: "ocean", name: "Ocean", description: "Azul profundo", cost: 50,
    lightOverrides: { primary: "#3D8AB5", accentBlue: "#6AAACC", success: "#4A9AAA", warning: "#C5A06A", error: "#B87A7A", background: "#F0F4F7", surface: "#F8FAFB", border: "#D0D8E0", textPrimary: "#2A3440", textSecondary: "#5A7895" },
    darkOverrides: { primary: "#6AAACC", accentBlue: "#8BBFDD", success: "#6ABAAA", warning: "#D4B07A", error: "#C48A8A", background: "#1A222A", surface: "#243038", border: "#3A4A55", textPrimary: "#E8EDF0", textSecondary: "#A8BAC8" } },
  { id: "cobalt", name: "Cobalt", description: "Azul cobalto intenso", cost: 50,
    lightOverrides: { primary: "#2A6AD4", accentBlue: "#5A8AE0", success: "#3A9A7A", warning: "#C5A040", error: "#CC4A4A", background: "#F0F4FC", surface: "#F6F8FE", border: "#D0D8EC", textPrimary: "#1A2038", textSecondary: "#4A5A8A" },
    darkOverrides: { primary: "#4A7AEA", accentBlue: "#7A9AF0", success: "#4AAA8A", warning: "#D4B050", error: "#DC5A5A", background: "#080C18", surface: "#12182A", border: "#283050", textPrimary: "#D8E4FC", textSecondary: "#8098C8" } },

  { id: "indigo", name: "Indigo", description: "Añil profundo", cost: 50,
    lightOverrides: { primary: "#4A5A9A", accentBlue: "#6A7ABA", success: "#4A7A6A", warning: "#B5A05A", error: "#B87A7A", background: "#F0EFF6", surface: "#F6F6FA", border: "#D0D0E2", textPrimary: "#2A2840", textSecondary: "#5A5A8A" },
    darkOverrides: { primary: "#6A7ABA", accentBlue: "#8A9AD8", success: "#5A8A7A", warning: "#C5B06A", error: "#C48A8A", background: "#161A28", surface: "#20243A", border: "#383C52", textPrimary: "#E8E5F2", textSecondary: "#A8A5C2" } },
  { id: "lavender", name: "Lavender", description: "Lavanda claro", cost: 50,
    lightOverrides: { primary: "#8A7ABA", accentBlue: "#A09ACA", success: "#6A8A7A", warning: "#C5A06A", error: "#B87A8A", background: "#F4F0F7", surface: "#FAF6FC", border: "#D8D0E0", textPrimary: "#322A40", textSecondary: "#6A6A8A" },
    darkOverrides: { primary: "#A09ACA", accentBlue: "#BAB4DA", success: "#7A9A8A", warning: "#C5B07A", error: "#C48A9A", background: "#1E1A28", surface: "#2A2438", border: "#403855", textPrimary: "#EAE5F0", textSecondary: "#AAA5C0" } },
  { id: "amethyst", name: "Amethyst", description: "Amatista vibrante", cost: 50,
    lightOverrides: { primary: "#8A6AAA", accentBlue: "#A08AC4", success: "#6A8A7A", warning: "#C5A06A", error: "#B87A8A", background: "#F4F0F8", surface: "#FAF6FC", border: "#D8D0E2", textPrimary: "#322A42", textSecondary: "#6A6A8A" },
    darkOverrides: { primary: "#A08AC4", accentBlue: "#BAAAD8", success: "#7A9A8A", warning: "#C5B07A", error: "#C48A9A", background: "#1E1828", surface: "#2A223A", border: "#403858", textPrimary: "#EAE5F2", textSecondary: "#AAA5C2" } },
  { id: "nightfall", name: "Nightfall", description: "Púrpura lavanda", cost: 50,
    lightOverrides: { primary: "#6A5A9A", accentBlue: "#8A7ABA", success: "#5A8A7A", warning: "#B5A05A", error: "#B87A8A", background: "#F2F0F5", surface: "#F8F6FA", border: "#D5D0E0", textPrimary: "#2E2A40", textSecondary: "#6A6A8A" },
    darkOverrides: { primary: "#8A7ABA", accentBlue: "#AA9ADA", success: "#7AAA8A", warning: "#CCB56A", error: "#C48A9A", background: "#1A1824", surface: "#24223A", border: "#3A3755", textPrimary: "#E8E5F0", textSecondary: "#A8A5C0" } },
  { id: "plum", name: "Plum", description: "Ciruela oscura", cost: 50,
    lightOverrides: { primary: "#7A4A6A", accentBlue: "#9A6A8A", success: "#6A7A5A", warning: "#C5A06A", error: "#B87A7A", background: "#F5F0F4", surface: "#FCF8FA", border: "#E0D0DA", textPrimary: "#3A2A38", textSecondary: "#7A6A7A" },
    darkOverrides: { primary: "#9A6A8A", accentBlue: "#B48AA4", success: "#7A8A6A", warning: "#CCB07A", error: "#C48A8A", background: "#1E1420", surface: "#2A1E2E", border: "#40384A", textPrimary: "#ECE5EA", textSecondary: "#B0A0AE" } },
  { id: "dusk", name: "Dusk", description: "Atardecer violáceo", cost: 50,
    lightOverrides: { primary: "#6A5A7A", accentBlue: "#8A7A9A", success: "#5A7A6A", warning: "#B5A06A", error: "#B87A8A", background: "#F2F0F4", surface: "#F8F6FA", border: "#D5D0DA", textPrimary: "#2E2A38", textSecondary: "#6A6A7A" },
    darkOverrides: { primary: "#8A7A9A", accentBlue: "#AA9AB8", success: "#6A8A7A", warning: "#C5B07A", error: "#C48A9A", background: "#1A1820", surface: "#242230", border: "#3A3850", textPrimary: "#E8E5EE", textSecondary: "#A8A5B8" } },

  { id: "lagoon", name: "Lagoon", description: "Laguna tropical", cost: 50,
    lightOverrides: { primary: "#3AAAB4", accentBlue: "#5AC4CC", success: "#4AB49A", warning: "#C5B05A", error: "#C47A6A", background: "#F0F8F8", surface: "#F6FAFA", border: "#D0E0E0", textPrimary: "#2A3A3A", textSecondary: "#5A7A7A" },
    darkOverrides: { primary: "#5AC4CC", accentBlue: "#7AD8DC", success: "#6AC4AA", warning: "#D4C06A", error: "#CC8A7A", background: "#14222A", surface: "#1E3034", border: "#36484A", textPrimary: "#E8F4F5", textSecondary: "#A8BEC0" } },
  { id: "teal", name: "Teal", description: "Verde azulado", cost: 50,
    lightOverrides: { primary: "#3A8A8A", accentBlue: "#5AAAAA", success: "#3A9A7A", warning: "#B5A06A", error: "#B87A6A", background: "#F0F5F4", surface: "#F6FAF8", border: "#D0DDDC", textPrimary: "#2A3A38", textSecondary: "#5A7A78" },
    darkOverrides: { primary: "#5AAAAA", accentBlue: "#7AC4C4", success: "#5AAA8A", warning: "#C5B07A", error: "#C48A7A", background: "#14201E", surface: "#1E2A28", border: "#364442", textPrimary: "#E8F0F0", textSecondary: "#A8BABA" } },
  { id: "hologram", name: "Hologram", description: "Cian holográfico", cost: 50,
    lightOverrides: { primary: "#3AB4D4", accentBlue: "#6ACCE0", success: "#4AC4B4", warning: "#C5B05A", error: "#C47A7A", background: "#F0F5FA", surface: "#F6FAFC", border: "#D0DCE8", textPrimary: "#2A3440", textSecondary: "#5A7A8A" },
    darkOverrides: { primary: "#5AD4EE", accentBlue: "#80E0F0", success: "#6AE0CC", warning: "#D4C060", error: "#D48A8A", background: "#0A1420", surface: "#142230", border: "#2A3A4A", textPrimary: "#E0F0FA", textSecondary: "#80B0C8" } },

  { id: "mint", name: "Mint", description: "Menta fresca", cost: 50,
    lightOverrides: { primary: "#5A9A8A", accentBlue: "#7ABAAA", success: "#4A8A6A", warning: "#B5A06A", error: "#B87A7A", background: "#F0F5F2", surface: "#F6FAF8", border: "#D0DDD5", textPrimary: "#2A3A32", textSecondary: "#5A7A6A" },
    darkOverrides: { primary: "#7ABAAA", accentBlue: "#9ACCBA", success: "#6AAA7A", warning: "#C5B07A", error: "#C48A8A", background: "#1A2420", surface: "#24302A", border: "#3A4840", textPrimary: "#E8F0EA", textSecondary: "#A8BAAA" } },
  { id: "jade", name: "Jade", description: "Jade intenso", cost: 50,
    lightOverrides: { primary: "#4A9A7A", accentBlue: "#6AB49A", success: "#3A8A6A", warning: "#B5A06A", error: "#B87A6A", background: "#F0F8F4", surface: "#F6FAF8", border: "#D0E0D8", textPrimary: "#2A3A32", textSecondary: "#5A7A6A" },
    darkOverrides: { primary: "#6AB49A", accentBlue: "#8ACCB0", success: "#5A9A7A", warning: "#C5B07A", error: "#C48A7A", background: "#14221C", surface: "#1E2E26", border: "#364840", textPrimary: "#E8F2EE", textSecondary: "#A8BEAA" } },
  { id: "emerald", name: "Emerald", description: "Verde joya", cost: 50,
    lightOverrides: { primary: "#4A8A6A", accentBlue: "#6AAA8A", success: "#3A7A5A", warning: "#B5A06A", error: "#B87A6A", background: "#F0F5F2", surface: "#F6FAF8", border: "#D0DDD5", textPrimary: "#2A3A32", textSecondary: "#5A7A6A" },
    darkOverrides: { primary: "#6AAA8A", accentBlue: "#8AC4A0", success: "#5A9A6A", warning: "#C5B07A", error: "#C48A6A", background: "#14201A", surface: "#1E2A22", border: "#35483A", textPrimary: "#E8F0EA", textSecondary: "#A8BAAA" } },
  { id: "forest", name: "Forest", description: "Verde salvia", cost: 50,
    lightOverrides: { primary: "#5B8A6A", accentBlue: "#7DAB8A", success: "#4A8A5A", warning: "#B5A06A", error: "#B87A6A", background: "#F2F5F0", surface: "#F8FAF5", border: "#D5DDCC", textPrimary: "#2E3A30", textSecondary: "#6A7A6A" },
    darkOverrides: { primary: "#7DAB8A", accentBlue: "#8BC49B", success: "#8BC49B", warning: "#C5B07A", error: "#C48A7A", background: "#1C241E", surface: "#263028", border: "#3D4A3D", textPrimary: "#E8EDE5", textSecondary: "#AAB8AA" } },
  { id: "moss", name: "Moss", description: "Musgo verde", cost: 50,
    lightOverrides: { primary: "#6A8A4A", accentBlue: "#8AAA6A", success: "#5A7A3A", warning: "#B5A06A", error: "#B87A6A", background: "#F2F5EE", surface: "#F8FAF4", border: "#D5DDC8", textPrimary: "#2E3A28", textSecondary: "#6A7A5A" },
    darkOverrides: { primary: "#8AAA6A", accentBlue: "#AAC48A", success: "#7A9A5A", warning: "#C5B07A", error: "#C48A7A", background: "#1C2218", surface: "#262E20", border: "#3D4835", textPrimary: "#E8F0E0", textSecondary: "#AABAA0" } },
  { id: "lime", name: "Lime", description: "Lima vibrante", cost: 50,
    lightOverrides: { primary: "#6ABA3A", accentBlue: "#8AD46A", success: "#4AAA2A", warning: "#C5B040", error: "#CC4A3A", background: "#F5FAF0", surface: "#FAFCF6", border: "#D5E5C8", textPrimary: "#2A3A1A", textSecondary: "#5A7A4A" },
    darkOverrides: { primary: "#7ACC4A", accentBlue: "#9AE07A", success: "#5AB83A", warning: "#D4C050", error: "#DC5A4A", background: "#0E1408", surface: "#1A2410", border: "#2A3A20", textPrimary: "#E0F5D0", textSecondary: "#8ABA7A" } },
  { id: "glitch", name: "Glitch", description: "CRT verde neón", cost: 50,
    lightOverrides: { primary: "#3AC46A", accentBlue: "#2AD4D4", success: "#4AE08A", warning: "#D4D040", error: "#E04040", background: "#F0F5F0", surface: "#F8FCF8", border: "#D0E0D5", textPrimary: "#1A2A20", textSecondary: "#5A7A6A" },
    darkOverrides: { primary: "#3AE07A", accentBlue: "#3AE0E0", success: "#5AEA9A", warning: "#E0DC50", error: "#EA5050", background: "#0A100A", surface: "#142014", border: "#2A3A2A", textPrimary: "#E0F5E0", textSecondary: "#8AB89A" } },
  { id: "matrix", name: "Matrix", description: "Fósforo verde sobre negro", cost: 50,
    lightOverrides: { primary: "#2AAA5A", accentBlue: "#4ABB7A", success: "#1A9A4A", warning: "#AAAA3A", error: "#AA3A3A", background: "#F0F5EE", surface: "#F8FCF6", border: "#D0DDD0", textPrimary: "#1A2A1A", textSecondary: "#5A7A5A" },
    darkOverrides: { primary: "#00CC41", accentBlue: "#33DD66", success: "#00AA33", warning: "#AABB33", error: "#BB3333", background: "#050A05", surface: "#0F1A0F", border: "#203020", textPrimary: "#CCFFCC", textSecondary: "#66AA77" } },

  { id: "blaze", name: "Blaze", description: "Rojo fuego intenso", cost: 50,
    lightOverrides: { primary: "#E05030", accentBlue: "#E0805A", success: "#7AB04A", warning: "#E0A030", error: "#D04020", background: "#FCF5F0", surface: "#FEFAF6", border: "#E8D5CC", textPrimary: "#3A201A", textSecondary: "#8A5A4A" },
    darkOverrides: { primary: "#E86040", accentBlue: "#EA906A", success: "#8AC05A", warning: "#EAB040", error: "#DC5030", background: "#1A0A08", surface: "#2A1410", border: "#402820", textPrimary: "#FCE8E0", textSecondary: "#C09880" } },
  { id: "cherry", name: "Cherry", description: "Rojo cereza intenso", cost: 50,
    lightOverrides: { primary: "#C45A6A", accentBlue: "#D48A8A", success: "#7A8A5A", warning: "#D4A06A", error: "#C44A4A", background: "#F7F0F2", surface: "#FCF8FA", border: "#E0D0D4", textPrimary: "#402A30", textSecondary: "#8A6A6A" },
    darkOverrides: { primary: "#D47A8A", accentBlue: "#E09AAA", success: "#8A9A6A", warning: "#E0B07A", error: "#D45A5A", background: "#24141A", surface: "#30202A", border: "#4A3840", textPrimary: "#F0E5EA", textSecondary: "#BAA0A8" } },
  { id: "crimson", name: "Crimson", description: "Carmesí profundo", cost: 50,
    lightOverrides: { primary: "#B04040", accentBlue: "#CC6A6A", success: "#7A8A5A", warning: "#D4A04A", error: "#B03030", background: "#F7F0F0", surface: "#FCF8F8", border: "#E0D0D0", textPrimary: "#402A2A", textSecondary: "#8A6A6A" },
    darkOverrides: { primary: "#CC6060", accentBlue: "#E08A8A", success: "#8A9A6A", warning: "#DCB05A", error: "#CC4040", background: "#241418", surface: "#301E24", border: "#4A383C", textPrimary: "#F0E5E8", textSecondary: "#BAA0A4" } },
  { id: "wine", name: "Wine", description: "Vino tinto", cost: 50,
    lightOverrides: { primary: "#8A3A4A", accentBlue: "#A0606A", success: "#6A7A5A", warning: "#B59A6A", error: "#8A2A3A", background: "#F4EEF0", surface: "#FAF6F8", border: "#E0D0D4", textPrimary: "#38222A", textSecondary: "#7A5A62" },
    darkOverrides: { primary: "#A05A6A", accentBlue: "#B87A8A", success: "#7A8A6A", warning: "#C5AA7A", error: "#A04050", background: "#1C1018", surface: "#2A1A22", border: "#44303A", textPrimary: "#EAE2E6", textSecondary: "#B29CA2" } },

  { id: "coral", name: "Coral", description: "Coral vibrante", cost: 50,
    lightOverrides: { primary: "#C47A6A", accentBlue: "#D49A7A", success: "#8A9A6A", warning: "#D4A06A", error: "#C46A5A", background: "#F7F2EE", surface: "#FCF8F4", border: "#E0D5CC", textPrimary: "#40302A", textSecondary: "#8A7268" },
    darkOverrides: { primary: "#D49A7A", accentBlue: "#E0B08A", success: "#9AAA7A", warning: "#D4B07A", error: "#D47A6A", background: "#241E18", surface: "#302820", border: "#4A3D35", textPrimary: "#F0EAE4", textSecondary: "#BAAAA0" } },
  { id: "coralreef", name: "Coral Reef", description: "Arrecife marino", cost: 50,
    lightOverrides: { primary: "#E07A6A", accentBlue: "#6AC4B4", success: "#7ABA7A", warning: "#D4A05A", error: "#D46050", background: "#F8F4F0", surface: "#FCFAF6", border: "#E8DCD8", textPrimary: "#42302E", textSecondary: "#8A6E6A" },
    darkOverrides: { primary: "#E8907A", accentBlue: "#7AD4C4", success: "#8ACA8A", warning: "#DCB06A", error: "#DC7060", background: "#241E1C", surface: "#322A28", border: "#4C403C", textPrimary: "#F0EAE8", textSecondary: "#BAAEAA" } },
  { id: "peach", name: "Peach", description: "Durazno cálido", cost: 50,
    lightOverrides: { primary: "#D4A080", accentBlue: "#E0B49A", success: "#9AAA7A", warning: "#D4A06A", error: "#C47A6A", background: "#FAF5F0", surface: "#FEFAF6", border: "#E8DCD0", textPrimary: "#4A3830", textSecondary: "#9A7A6A" },
    darkOverrides: { primary: "#DCB090", accentBlue: "#E8C0AA", success: "#AABA8A", warning: "#DCAE7A", error: "#CC8A7A", background: "#262018", surface: "#342C22", border: "#4E4038", textPrimary: "#F2ECE6", textSecondary: "#C2AA9A" } },
  { id: "sunset", name: "Sunset", description: "Naranja ámbar", cost: 50,
    lightOverrides: { primary: "#C48A5C", accentBlue: "#D4A07A", success: "#8A9A6A", warning: "#D4A06A", error: "#C47A5A", background: "#F7F2EC", surface: "#FCF8F2", border: "#E0D5C8", textPrimary: "#403530", textSecondary: "#8A7A6A" },
    darkOverrides: { primary: "#D4A07A", accentBlue: "#E0B08A", success: "#9AAA7A", warning: "#E4B07A", error: "#D48A6A", background: "#241E1A", surface: "#302822", border: "#4A3D35", textPrimary: "#F0EAE5", textSecondary: "#BAAAA0" } },
  { id: "tangerine", name: "Tangerine", description: "Mandarina brillante", cost: 50,
    lightOverrides: { primary: "#E0803A", accentBlue: "#E8A06A", success: "#8AAA5A", warning: "#E0A03A", error: "#D4683A", background: "#FAF4EC", surface: "#FEFAF4", border: "#E8DCC8", textPrimary: "#423020", textSecondary: "#8A725A" },
    darkOverrides: { primary: "#E8904A", accentBlue: "#F0AA7A", success: "#9ABA6A", warning: "#E8B04A", error: "#DC784A", background: "#261C12", surface: "#34281C", border: "#4E4030", textPrimary: "#F2EAE0", textSecondary: "#C2AA90" } },
  { id: "terminal", name: "Terminal", description: "Ámbar retro", cost: 50,
    lightOverrides: { primary: "#D48A3A", accentBlue: "#D4AA6A", success: "#8AAA5A", warning: "#D4B03A", error: "#C46A3A", background: "#F5F0E8", surface: "#FCF8F0", border: "#DDD5C0", textPrimary: "#3A3020", textSecondary: "#8A7A5A" },
    darkOverrides: { primary: "#FFB000", accentBlue: "#FFCC55", success: "#AACC44", warning: "#FFCC00", error: "#FF5533", background: "#0A0805", surface: "#1A1408", border: "#2A2415", textPrimary: "#FFE8AA", textSecondary: "#CCAA55" } },

  { id: "autumn", name: "Autumn", description: "Otoño cálido", cost: 50,
    lightOverrides: { primary: "#B57A4A", accentBlue: "#C49A6A", success: "#7A9A5A", warning: "#D4A04A", error: "#B85A4A", background: "#F7F0E8", surface: "#FCF8F2", border: "#E0D5C5", textPrimary: "#403028", textSecondary: "#8A7A5A" },
    darkOverrides: { primary: "#CCA070", accentBlue: "#D8B080", success: "#8AAA6A", warning: "#E0B060", error: "#C86A5A", background: "#221A14", surface: "#2E241C", border: "#4A3D30", textPrimary: "#F0EAE0", textSecondary: "#BAB09A" } },
  { id: "tuscany", name: "Tuscany", description: "Toscana mediterránea", cost: 50,
    lightOverrides: { primary: "#C4905A", accentBlue: "#D4AA7A", success: "#8A9A6A", warning: "#D4A85A", error: "#C47A5A", background: "#F7F2EA", surface: "#FCFAF2", border: "#E0D8C8", textPrimary: "#40352A", textSecondary: "#8A7A62" },
    darkOverrides: { primary: "#CCA06A", accentBlue: "#DCB88A", success: "#9AAA7A", warning: "#DCB46A", error: "#CC8A6A", background: "#221C16", surface: "#30281E", border: "#4A4035", textPrimary: "#F0ECE2", textSecondary: "#BAB2A0" } },
  { id: "clay", name: "Clay", description: "Arcilla terracota", cost: 50,
    lightOverrides: { primary: "#B07A5A", accentBlue: "#C49A7A", success: "#7A9A6A", warning: "#C5A06A", error: "#B86A4A", background: "#F5F0EA", surface: "#FCF8F2", border: "#E0D5CC", textPrimary: "#3A3028", textSecondary: "#7A6A5A" },
    darkOverrides: { primary: "#C08A6A", accentBlue: "#D4A48A", success: "#8AAA7A", warning: "#CCB07A", error: "#C87A5A", background: "#221A14", surface: "#2E241C", border: "#4A3D34", textPrimary: "#F0EAE2", textSecondary: "#BAAAA0" } },
  { id: "chocolate", name: "Chocolate", description: "Cacao profundo", cost: 50,
    lightOverrides: { primary: "#8A6A4A", accentBlue: "#A08A6A", success: "#6A8A5A", warning: "#C5A06A", error: "#B86A5A", background: "#F5F0EA", surface: "#FCF8F4", border: "#DDD5C8", textPrimary: "#3A3028", textSecondary: "#7A6A5A" },
    darkOverrides: { primary: "#A08060", accentBlue: "#B8A080", success: "#7A9A6A", warning: "#D4B07A", error: "#C87A6A", background: "#1C1612", surface: "#28201A", border: "#40382E", textPrimary: "#F0EAE2", textSecondary: "#BAB09A" } },

  { id: "gold", name: "Gold", description: "Dorado cálido", cost: 50,
    lightOverrides: { primary: "#B59A5A", accentBlue: "#C5AA6A", success: "#8A9A6A", warning: "#D4B06A", error: "#B87A6A", background: "#F7F4EC", surface: "#FCFAF2", border: "#E0D8C0", textPrimary: "#40382A", textSecondary: "#8A7A5A" },
    darkOverrides: { primary: "#C5AA6A", accentBlue: "#D5BA7A", success: "#9AAA7A", warning: "#DDC07A", error: "#C48A7A", background: "#24201A", surface: "#302A20", border: "#4A4035", textPrimary: "#F0ECE0", textSecondary: "#BAB09A" } },
  { id: "buttercup", name: "Buttercup", description: "Amarillo manteca", cost: 50,
    lightOverrides: { primary: "#D4B04A", accentBlue: "#E0C06A", success: "#9AAA6A", warning: "#D4A83A", error: "#C48A4A", background: "#FAF6EC", surface: "#FEFCF4", border: "#E8E0C8", textPrimary: "#423A28", textSecondary: "#8A7A52" },
    darkOverrides: { primary: "#DCBC5A", accentBlue: "#E8CA7A", success: "#AABA7A", warning: "#DCB44A", error: "#CC9A5A", background: "#262216", surface: "#342E20", border: "#4E4838", textPrimary: "#F2EEE0", textSecondary: "#C2BA9A" } },
  { id: "solar", name: "Solar", description: "Amarillo energía", cost: 50,
    lightOverrides: { primary: "#E8A830", accentBlue: "#F0C060", success: "#7AB84A", warning: "#E8A020", error: "#E06030", background: "#FFF8EC", surface: "#FFFCF4", border: "#F0E0C0", textPrimary: "#3A3020", textSecondary: "#8A7A4A" },
    darkOverrides: { primary: "#F0C050", accentBlue: "#F5D080", success: "#8ACC5A", warning: "#F0B030", error: "#E87040", background: "#1A1408", surface: "#2A2010", border: "#403820", textPrimary: "#FCF0D0", textSecondary: "#C0A870" } },

  { id: "vaporwave", name: "Vaporwave", description: "Retro 80s neón", cost: 50,
    lightOverrides: { primary: "#C46AD4", accentBlue: "#6AC4E0", success: "#6AD4A0", warning: "#E0C060", error: "#E06A8A", background: "#F5F0F8", surface: "#FCF8FC", border: "#E0D5E8", textPrimary: "#2A2038", textSecondary: "#7A6A8A" },
    darkOverrides: { primary: "#D47AEA", accentBlue: "#6AD4EE", success: "#6AE0AA", warning: "#E8CC70", error: "#EA7A9A", background: "#100A1A", surface: "#1E1430", border: "#352850", textPrimary: "#F0E0FA", textSecondary: "#B08AC8" } },
  { id: "rose", name: "Rose", description: "Rosa suave", cost: 50,
    lightOverrides: { primary: "#C47A9A", accentBlue: "#D49AB0", success: "#8A9A7A", warning: "#D4A07A", error: "#C47A7A", background: "#F7F0F3", surface: "#FCF8FA", border: "#E0D0D8", textPrimary: "#402E38", textSecondary: "#8A6A7A" },
    darkOverrides: { primary: "#D49AB0", accentBlue: "#E0B0C4", success: "#9AAA8A", warning: "#D4B07A", error: "#D48A8A", background: "#241A20", surface: "#302830", border: "#4A3845", textPrimary: "#F0E5EA", textSecondary: "#BAA0AC" } },
  { id: "sakura", name: "Sakura", description: "Cerezo en flor", cost: 50,
    lightOverrides: { primary: "#E0AAB4", accentBlue: "#EAC0CA", success: "#AAB49A", warning: "#D4B08A", error: "#C48A8A", background: "#FCF6F8", surface: "#FEFAFB", border: "#E8DEE2", textPrimary: "#4A3840", textSecondary: "#9A7A84" },
    darkOverrides: { primary: "#E8BEC4", accentBlue: "#F0CED6", success: "#B4C0A0", warning: "#DABA8A", error: "#C88A8A", background: "#282028", surface: "#342C34", border: "#4E4050", textPrimary: "#F2EAEE", textSecondary: "#C2AAB4" } },
  { id: "candy", name: "Candy", description: "Rosa neón vibrante", cost: 50,
    lightOverrides: { primary: "#E06A9A", accentBlue: "#6AC4E0", success: "#6AE0A0", warning: "#E0C060", error: "#E06A6A", background: "#FAF5F8", surface: "#FEFAFB", border: "#E8D5E0", textPrimary: "#402A38", textSecondary: "#8A6A7A" },
    darkOverrides: { primary: "#E88AAA", accentBlue: "#8AD4E8", success: "#8AE8B0", warning: "#E8CC70", error: "#E87A7A", background: "#1A1220", surface: "#2A1E30", border: "#483850", textPrimary: "#F0E5F0", textSecondary: "#BAA0C0" } },
  { id: "fuchsia", name: "Fuchsia", description: "Fucsia magnético", cost: 50,
    lightOverrides: { primary: "#D44A8A", accentBlue: "#E07AAA", success: "#6AAA5A", warning: "#D4A040", error: "#CC3A5A", background: "#FCF0F6", surface: "#FEF6FA", border: "#E8D0E0", textPrimary: "#3A1A30", textSecondary: "#8A4A6A" },
    darkOverrides: { primary: "#E0609A", accentBlue: "#EA8ABA", success: "#7ABA6A", warning: "#E0B050", error: "#DC4A6A", background: "#1A0818", surface: "#2A1428", border: "#402840", textPrimary: "#FCE0F0", textSecondary: "#C080B0" } },
  { id: "cyber", name: "Cyber", description: "Neón futurista", cost: 50,
    lightOverrides: { primary: "#D44A8A", accentBlue: "#4AC4D4", success: "#4AD48A", warning: "#D4B04A", error: "#D44A4A", background: "#F5F0F7", surface: "#FCF8FC", border: "#E0D5E5", textPrimary: "#2A2030", textSecondary: "#7A6A8A" },
    darkOverrides: { primary: "#E06AAA", accentBlue: "#6AD4E0", success: "#6AE0A0", warning: "#E0C060", error: "#E06A6A", background: "#0D0D1A", surface: "#1A1830", border: "#353050", textPrimary: "#EAE0F0", textSecondary: "#B0A0C0" } },
];

export function getThemeById(id: string): ThemeVariant {
  return THEMES.find((t) => t.id === id) ?? THEMES[0];
}

export type BackgroundVariant = {
  id: string;
  name: string;
  description: string;
  cost: number;
  variant: number;
};

const DEFAULT_BACKGROUND: BackgroundVariant = {
  id: "flat", name: "Vacío", description: "Fondo limpio sin figuras", cost: 0, variant: 10,
};

export const BACKGROUNDS: BackgroundVariant[] = [
  { id: "flat", name: "Vacío", description: "Fondo limpio sin figuras", cost: 0, variant: 10 },
  { id: "circles", name: "Círculos", description: "Círculos dispersos", cost: 50, variant: 1 },
  { id: "diamonds", name: "Diamantes", description: "Rombos geométricos", cost: 50, variant: 2 },
  { id: "triangles", name: "Triángulos", description: "Triángulos superpuestos", cost: 50, variant: 3 },
  { id: "rings", name: "Anillos", description: "Aros concéntricos", cost: 50, variant: 4 },
  { id: "mixed", name: "Mixto", description: "Figuras variadas", cost: 50, variant: 5 },
  { id: "dots", name: "Puntos", description: "Pequeños puntos salpicados", cost: 50, variant: 6 },
  { id: "squares", name: "Cuadrados", description: "Cuadrados geométricos", cost: 50, variant: 13 },
  { id: "crosses", name: "Cruces", description: "Cruces decorativas", cost: 50, variant: 11 },
  { id: "arrows", name: "Flechas", description: "Flechas direccionales", cost: 50, variant: 14 },
  { id: "waves", name: "Ondas", description: "Líneas onduladas", cost: 50, variant: 12 },
  { id: "stars", name: "Estrellas", description: "Estrellas brillantes", cost: 50, variant: 9 },
  { id: "pentagono", name: "Pentágonos", description: "Polígonos de 5 lados", cost: 50, variant: 7 },
  { id: "hexagons", name: "Hexágonos", description: "Polígonos de 6 lados", cost: 50, variant: 8 },
  { id: "heptagons", name: "Heptágonos", description: "Polígonos de 7 lados", cost: 50, variant: 16 },
  { id: "octagons", name: "Octágonos", description: "Polígonos de 8 lados", cost: 50, variant: 17 },
  { id: "nonagons", name: "Nonágonos", description: "Polígonos de 9 lados", cost: 50, variant: 18 },
  { id: "decagons", name: "Decágonos", description: "Polígonos de 10 lados", cost: 50, variant: 19 },
  { id: "dodecagons", name: "Dodecágonos", description: "Polígonos de 12 lados", cost: 50, variant: 20 },
  { id: "cylinders", name: "Cilindros", description: "Cilindros 3D", cost: 50, variant: 15 },
];

export function getBackgroundById(id: string): BackgroundVariant {
  return BACKGROUNDS.find((b) => b.id === id) ?? DEFAULT_BACKGROUND;
}

export function getThemePreviewColors(
  variantId: string,
  isDark: boolean
): { primary: string; success: string; warning: string; error: string; accentBlue: string } {
  const theme = getThemeById(variantId);
  const base = isDark ? DARK : LIGHT;
  const overrides = isDark ? theme.darkOverrides : theme.lightOverrides;
  return {
    primary: overrides.primary ?? base.primary,
    accentBlue: overrides.accentBlue ?? base.accentBlue,
    success: overrides.success ?? base.success,
    warning: overrides.warning ?? base.warning,
    error: overrides.error ?? base.error,
  };
}
