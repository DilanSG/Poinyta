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

const getNonagonPoints = (size: number) => getPolygonPoints(size, 9);

export default function NonagonsBg({ colors }: { colors: ThemeColors }) {
  const c = colors.primary;

  const nonagons = [
    { top: "3%", left: "8%", size: 100, opacity: 0.08, rotate: "0deg", type: "outline" },
    { top: "2%", right: "12%", size: 80, opacity: 0.09, rotate: "25deg", type: "outline" },
    { top: "16%", left: "30%", size: 60, opacity: 0.12, rotate: "-15deg", type: "fill" },
    { top: "12%", right: "5%", size: 120, opacity: 0.07, rotate: "40deg", type: "outline" },
    { top: "30%", left: "4%", size: 90, opacity: 0.08, rotate: "-20deg", type: "outline" },
    { top: "28%", right: "8%", size: 110, opacity: 0.07, rotate: "10deg", type: "outline" },
    { top: "44%", left: "35%", size: 70, opacity: 0.1, rotate: "35deg", type: "fill" },
    { top: "42%", right: "4%", size: 140, opacity: 0.06, rotate: "-8deg", type: "outline" },
    { top: "58%", left: "8%", size: 100, opacity: 0.08, rotate: "20deg", type: "outline" },
    { top: "56%", right: "10%", size: 80, opacity: 0.09, rotate: "-30deg", type: "outline" },
    { top: "72%", left: "28%", size: 65, opacity: 0.11, rotate: "15deg", type: "fill" },
    { top: "70%", right: "4%", size: 130, opacity: 0.06, rotate: "-12deg", type: "outline" },
    { top: "86%", left: "6%", size: 90, opacity: 0.08, rotate: "30deg", type: "outline" },
    { top: "84%", right: "12%", size: 110, opacity: 0.07, rotate: "-25deg", type: "outline" },
  ];

  return (
    <>
      {nonagons.map((n, i) => (
        <View key={i} style={{
          position: "absolute", top: n.top as any, left: n.left as any, right: n.right as any,
          width: n.size, height: n.size, opacity: n.opacity, transform: [{ rotate: n.rotate }],
        }}>
          <Svg width={n.size} height={n.size} viewBox={`0 0 ${n.size} ${n.size}`}>
            <Polygon points={getNonagonPoints(n.size)} fill={n.type === "fill" ? c : "none"} stroke={n.type === "outline" ? c : "none"} strokeWidth={n.type === "outline" ? 2.5 : 0} />
          </Svg>
        </View>
      ))}
    </>
  );
}
