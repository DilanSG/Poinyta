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

const getOctagonPoints = (size: number) => getPolygonPoints(size, 8);

export default function OctagonsBg({ colors }: { colors: ThemeColors }) {
  const c = colors.primary;

  const octagons = [
    // Inner ring — small fills near center
    { top: "38%", left: "42%", size: 55, opacity: 0.15, rotate: "0deg", type: "fill" },
    { top: "44%", left: "38%", size: 45, opacity: 0.14, rotate: "22deg", type: "fill" },
    { top: "40%", left: "50%", size: 50, opacity: 0.13, rotate: "-15deg", type: "outline" },

    // Mid ring — medium mixed
    { top: "28%", left: "30%", size: 80, opacity: 0.1, rotate: "35deg", type: "fill" },
    { top: "32%", left: "55%", size: 90, opacity: 0.09, rotate: "-20deg", type: "outline" },
    { top: "50%", left: "28%", size: 75, opacity: 0.1, rotate: "45deg", type: "outline" },
    { top: "48%", left: "58%", size: 85, opacity: 0.09, rotate: "-8deg", type: "fill" },
    { top: "22%", left: "44%", size: 70, opacity: 0.11, rotate: "18deg", type: "fill" },
    { top: "58%", left: "42%", size: 65, opacity: 0.11, rotate: "-30deg", type: "outline" },

    // Outer ring — large outlines
    { top: "12%", left: "14%", size: 130, opacity: 0.06, rotate: "10deg", type: "outline" },
    { top: "8%", left: "65%", size: 140, opacity: 0.05, rotate: "-35deg", type: "fill" },
    { top: "22%", left: "6%", size: 120, opacity: 0.06, rotate: "40deg", type: "outline" },
    { top: "18%", left: "78%", size: 110, opacity: 0.07, rotate: "-12deg", type: "fill" },
    { top: "40%", left: "8%", size: 150, opacity: 0.05, rotate: "25deg", type: "outline" },
    { top: "36%", left: "80%", size: 130, opacity: 0.06, rotate: "-40deg", type: "fill" },
    { top: "62%", left: "14%", size: 120, opacity: 0.06, rotate: "15deg", type: "outline" },
    { top: "58%", left: "72%", size: 140, opacity: 0.05, rotate: "-22deg", type: "fill" },
    { top: "78%", left: "20%", size: 130, opacity: 0.06, rotate: "30deg", type: "outline" },
    { top: "74%", left: "68%", size: 150, opacity: 0.05, rotate: "-10deg", type: "fill" },

    // Corners — extra large
    { top: "-4%", left: "-5%", size: 160, opacity: 0.04, rotate: "0deg", type: "outline" },
    { top: "-2%", right: "-6%", size: 170, opacity: 0.04, rotate: "45deg", type: "outline", useRight: true },
    { top: "82%", left: "-4%", size: 180, opacity: 0.04, rotate: "20deg", type: "fill" },
    { top: "80%", right: "-8%", size: 190, opacity: 0.04, rotate: "-15deg", type: "fill", useRight: true },
  ];

  return (
    <>
      {octagons.map((o, i) => (
        <View key={i} style={{
          position: "absolute",
          top: o.top as any,
          left: (o as any).useRight ? undefined : o.left as any,
          right: (o as any).useRight ? o.right as any : undefined,
          width: o.size, height: o.size, opacity: o.opacity, transform: [{ rotate: o.rotate }],
        }}>
          <Svg width={o.size} height={o.size} viewBox={`0 0 ${o.size} ${o.size}`}>
            <Polygon points={getOctagonPoints(o.size)} fill={o.type === "fill" ? c : "none"} stroke={o.type === "outline" ? c : "none"} strokeWidth={o.type === "outline" ? 2.5 : 0} />
          </Svg>
        </View>
      ))}
    </>
  );
}
