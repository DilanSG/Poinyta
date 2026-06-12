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

const getDecagonPoints = (size: number) => getPolygonPoints(size, 10);

export default function DecagonsBg({ colors }: { colors: ThemeColors }) {
  const c = colors.primary;

  const decagons = [
    { top: "3%", left: "5%", size: 95, opacity: 0.08, rotate: "0deg", type: "fill" },
    { top: "5%", right: "14%", size: 70, opacity: 0.1, rotate: "22deg", type: "fill" },
    { top: "16%", left: "35%", size: 55, opacity: 0.12, rotate: "-18deg", type: "outline" },
    { top: "12%", right: "4%", size: 110, opacity: 0.07, rotate: "35deg", type: "fill" },
    { top: "28%", left: "3%", size: 85, opacity: 0.09, rotate: "-25deg", type: "fill" },
    { top: "32%", right: "8%", size: 65, opacity: 0.11, rotate: "10deg", type: "fill" },
    { top: "46%", left: "30%", size: 50, opacity: 0.13, rotate: "45deg", type: "outline" },
    { top: "44%", right: "5%", size: 100, opacity: 0.08, rotate: "-12deg", type: "fill" },
    { top: "60%", left: "7%", size: 80, opacity: 0.09, rotate: "28deg", type: "fill" },
    { top: "64%", right: "12%", size: 60, opacity: 0.11, rotate: "-35deg", type: "outline" },
    { top: "76%", left: "28%", size: 90, opacity: 0.08, rotate: "15deg", type: "fill" },
    { top: "74%", right: "4%", size: 110, opacity: 0.07, rotate: "-8deg", type: "fill" },
    { top: "88%", left: "8%", size: 75, opacity: 0.1, rotate: "30deg", type: "fill" },
    { top: "86%", right: "14%", size: 95, opacity: 0.08, rotate: "-20deg", type: "outline" },
  ];

  return (
    <>
      {decagons.map((d, i) => (
        <View key={i} style={{
          position: "absolute", top: d.top as any, left: d.left as any, right: d.right as any,
          width: d.size, height: d.size, opacity: d.opacity, transform: [{ rotate: d.rotate }],
        }}>
          <Svg width={d.size} height={d.size} viewBox={`0 0 ${d.size} ${d.size}`}>
            <Polygon points={getDecagonPoints(d.size)} fill={d.type === "fill" ? c : "none"} stroke={d.type === "outline" ? c : "none"} strokeWidth={d.type === "outline" ? 2.5 : 0} />
          </Svg>
        </View>
      ))}
    </>
  );
}
