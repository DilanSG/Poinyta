import { View } from "react-native";
import { ThemeColors } from "../../lib/theme";

type Cylinder = {
  top: string;
  left?: string;
  right?: string;
  width: number;
  height: number;
  opacity: number;
  rotate: string;
  type: "fill" | "outline";
};

export default function CylindersBg({ colors }: { colors: ThemeColors }) {
  const c = colors.primary;

  const cylinders: Cylinder[] = [
    // Fila superior (0-15%)
    { top: "2%", left: "6%", width: 42, height: 90, opacity: 0.07, rotate: "-12deg", type: "fill" },
    { top: "4%", right: "10%", width: 36, height: 78, opacity: 0.08, rotate: "20deg", type: "outline" },
    { top: "12%", left: "30%", width: 30, height: 66, opacity: 0.1, rotate: "38deg", type: "outline" },
    { top: "10%", right: "5%", width: 44, height: 95, opacity: 0.06, rotate: "-8deg", type: "fill" },

    // Fila media-alta (18-38%)
    { top: "20%", left: "3%", width: 38, height: 82, opacity: 0.08, rotate: "25deg", type: "outline" },
    { top: "22%", left: "22%", width: 34, height: 74, opacity: 0.09, rotate: "-20deg", type: "fill" },
    { top: "18%", right: "4%", width: 40, height: 86, opacity: 0.07, rotate: "15deg", type: "fill" },
    { top: "34%", left: "38%", width: 28, height: 62, opacity: 0.11, rotate: "-30deg", type: "outline" },

    // Fila media-baja (42-62%)
    { top: "44%", left: "6%", width: 46, height: 98, opacity: 0.06, rotate: "-18deg", type: "fill" },
    { top: "42%", left: "28%", width: 32, height: 70, opacity: 0.09, rotate: "14deg", type: "outline" },
    { top: "48%", right: "8%", width: 38, height: 84, opacity: 0.07, rotate: "-35deg", type: "fill" },
    { top: "58%", left: "16%", width: 30, height: 68, opacity: 0.1, rotate: "42deg", type: "outline" },

    // Fila inferior (66-90%)
    { top: "68%", left: "8%", width: 40, height: 88, opacity: 0.07, rotate: "28deg", type: "fill" },
    { top: "66%", right: "6%", width: 34, height: 76, opacity: 0.08, rotate: "-14deg", type: "outline" },
    { top: "80%", left: "24%", width: 36, height: 80, opacity: 0.08, rotate: "-25deg", type: "fill" },
    { top: "84%", right: "12%", width: 42, height: 92, opacity: 0.07, rotate: "18deg", type: "outline" },
  ];

  return (
    <>
      {cylinders.map((cyl, index) => (
        <View
          key={index}
          style={{
            position: "absolute",
            top: cyl.top as any,
            left: cyl.left as any,
            right: cyl.right as any,
            width: cyl.width,
            height: cyl.height,
            opacity: cyl.opacity,
            borderRadius: 999,
            backgroundColor: cyl.type === "fill" ? c : "transparent",
            borderWidth: cyl.type === "outline" ? 2 : 0,
            borderColor: c,
            transform: [{ rotate: cyl.rotate }],
          }}
        />
      ))}
    </>
  );
}