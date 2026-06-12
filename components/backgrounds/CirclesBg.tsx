import { View } from "react-native";
import { ThemeColors } from "../../lib/theme";

export default function CirclesBg({ colors }: { colors: ThemeColors }) {
  const c = colors.primary;

  const circles = [
    // Large circles
    { size: 200, top: "-5%", left: "-10%", opacity: 0.05, filled: true },
    { size: 180, top: "15%", right: "-8%", opacity: 0.06, filled: true },
    { size: 150, bottom: "10%", left: "-5%", opacity: 0.07, filled: false, borderWidth: 2 },
    { size: 220, bottom: "-10%", right: "-15%", opacity: 0.04, filled: true },

    // Medium circles
    { size: 110, top: "30%", left: "15%", opacity: 0.08, filled: true },
    { size: 90, top: "45%", right: "20%", opacity: 0.09, filled: false, borderWidth: 1.5 },
    { size: 120, top: "65%", left: "70%", opacity: 0.07, filled: true },
    { size: 80, bottom: "40%", right: "10%", opacity: 0.1, filled: true },
    { size: 100, top: "80%", left: "30%", opacity: 0.06, filled: false, borderWidth: 2 },

    // Small circles
    { size: 45, top: "10%", left: "45%", opacity: 0.12, filled: true },
    { size: 35, top: "25%", right: "40%", opacity: 0.11, filled: true },
    { size: 50, bottom: "20%", left: "20%", opacity: 0.09, filled: false, borderWidth: 1 },
    { size: 40, top: "55%", left: "10%", opacity: 0.13, filled: true },
    { size: 30, bottom: "15%", right: "25%", opacity: 0.14, filled: true },
    { size: 60, top: "85%", right: "45%", opacity: 0.08, filled: false, borderWidth: 1.5 },

    // Tiny accent circles
    { size: 20, top: "5%", right: "18%", opacity: 0.15, filled: true },
    { size: 25, bottom: "35%", left: "55%", opacity: 0.12, filled: true },
    { size: 18, top: "48%", right: "55%", opacity: 0.14, filled: false, borderWidth: 1 },
    { size: 22, bottom: "8%", left: "80%", opacity: 0.13, filled: true },
  ];

  return (
    <>
      {circles.map((circle, index) => {
        const style: any = {
          position: "absolute",
          width: circle.size,
          height: circle.size,
          borderRadius: circle.size / 2,
          opacity: circle.opacity,
        };

        if (circle.filled) {
          style.backgroundColor = c;
        } else {
          style.borderWidth = circle.borderWidth || 1.5;
          style.borderColor = c;
          style.backgroundColor = "transparent";
        }

        if (circle.top !== undefined) style.top = circle.top;
        if (circle.bottom !== undefined) style.bottom = circle.bottom;
        if (circle.left !== undefined) style.left = circle.left;
        if (circle.right !== undefined) style.right = circle.right;

        return <View key={index} style={style} />;
      })}
    </>
  );
}