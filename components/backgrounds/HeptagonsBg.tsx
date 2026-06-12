import { View } from "react-native";
import Svg, { Polygon } from "react-native-svg";
import { ThemeColors } from "../../lib/theme";

const getPolygonPoints = (size: number, sides: number): string => {
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2;
  const angles = Array.from({ length: sides }, (_, i) => ((i * 360) / sides - 90) * (Math.PI / 180));
  return angles.map((a) => `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`).join(" ");
};

const getHeptagonPoints = (size: number) => getPolygonPoints(size, 7);

export default function HeptagonsBg({ colors }: { colors: ThemeColors }) {
  const c = colors.primary;

  const heptagons = [
    { top: "-2%", left: "-3%", size: 90, opacity: 0.08, rotate: "25deg", type: "fill" },
    { top: "4%", left: "12%", size: 130, opacity: 0.06, rotate: "-10deg", type: "outline" },
    { top: "-5%", left: "40%", size: 110, opacity: 0.07, rotate: "50deg", type: "fill" },
    { top: "8%", left: "60%", size: 80, opacity: 0.09, rotate: "-15deg", type: "outline" },
    { top: "2%", left: "80%", size: 140, opacity: 0.06, rotate: "30deg", type: "fill" },

    { top: "16%", left: "5%", size: 120, opacity: 0.07, rotate: "-20deg", type: "outline" },
    { top: "22%", left: "28%", size: 95, opacity: 0.08, rotate: "15deg", type: "fill" },
    { top: "18%", left: "50%", size: 150, opacity: 0.05, rotate: "-35deg", type: "outline" },
    { top: "25%", left: "72%", size: 100, opacity: 0.07, rotate: "10deg", type: "fill" },

    { top: "36%", left: "-2%", size: 140, opacity: 0.06, rotate: "40deg", type: "fill" },
    { top: "40%", left: "22%", size: 85, opacity: 0.09, rotate: "-8deg", type: "outline" },
    { top: "34%", left: "42%", size: 130, opacity: 0.06, rotate: "20deg", type: "fill" },
    { top: "42%", left: "65%", size: 110, opacity: 0.07, rotate: "-25deg", type: "outline" },
    { top: "38%", left: "85%", size: 90, opacity: 0.08, rotate: "55deg", type: "fill" },

    { top: "54%", left: "6%", size: 100, opacity: 0.07, rotate: "-12deg", type: "outline" },
    { top: "58%", left: "32%", size: 140, opacity: 0.06, rotate: "35deg", type: "fill" },
    { top: "52%", left: "55%", size: 85, opacity: 0.09, rotate: "-40deg", type: "outline" },
    { top: "60%", left: "78%", size: 130, opacity: 0.06, rotate: "5deg", type: "fill" },

    { top: "72%", left: "2%", size: 120, opacity: 0.07, rotate: "22deg", type: "fill" },
    { top: "76%", left: "25%", size: 95, opacity: 0.08, rotate: "-18deg", type: "outline" },
    { top: "70%", left: "48%", size: 150, opacity: 0.05, rotate: "45deg", type: "fill" },
    { top: "78%", left: "70%", size: 100, opacity: 0.07, rotate: "-5deg", type: "outline" },

    { top: "88%", left: "8%", size: 110, opacity: 0.07, rotate: "30deg", type: "outline" },
    { top: "92%", left: "35%", size: 80, opacity: 0.09, rotate: "-30deg", type: "fill" },
    { top: "86%", left: "60%", size: 130, opacity: 0.06, rotate: "15deg", type: "outline" },
    { top: "90%", left: "82%", size: 100, opacity: 0.07, rotate: "-22deg", type: "fill" },
  ];

  return (
    <>
      {heptagons.map((h, i) => (
        <View key={i} style={{
          position: "absolute", top: h.top as any, left: h.left as any,
          width: h.size, height: h.size, opacity: h.opacity, transform: [{ rotate: h.rotate }],
        }}>
          <Svg width={h.size} height={h.size} viewBox={`0 0 ${h.size} ${h.size}`}>
            <Polygon points={getHeptagonPoints(h.size)} fill={h.type === "fill" ? c : "none"} stroke={h.type === "outline" ? c : "none"} strokeWidth={h.type === "outline" ? 2.5 : 0} />
          </Svg>
        </View>
      ))}
    </>
  );
}
