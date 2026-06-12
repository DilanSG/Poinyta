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

const getDodecagonPoints = (size: number) => getPolygonPoints(size, 12);

export default function DodecagonsBg({ colors }: { colors: ThemeColors }) {
  const c = colors.primary;

  const dodecagons = [
    { top: "4%", left: "6%", size: 130, opacity: 0.06, rotate: "0deg", type: "outline" },
    { top: "2%", left: "14%", size: 90, opacity: 0.08, rotate: "25deg", type: "fill" },
    { top: "10%", left: "60%", size: 150, opacity: 0.05, rotate: "-12deg", type: "outline" },
    { top: "22%", left: "38%", size: 110, opacity: 0.07, rotate: "35deg", type: "fill" },
    { top: "28%", left: "4%", size: 170, opacity: 0.04, rotate: "15deg", type: "outline" },
    { top: "40%", left: "18%", size: 100, opacity: 0.07, rotate: "-22deg", type: "fill" },
    { top: "38%", left: "55%", size: 140, opacity: 0.05, rotate: "40deg", type: "outline" },
    { top: "54%", left: "38%", size: 80, opacity: 0.09, rotate: "-8deg", type: "fill" },
    { top: "60%", left: "6%", size: 160, opacity: 0.04, rotate: "20deg", type: "outline" },
    { top: "68%", left: "22%", size: 95, opacity: 0.08, rotate: "-30deg", type: "fill" },
    { top: "74%", left: "52%", size: 130, opacity: 0.06, rotate: "10deg", type: "outline" },
    { top: "84%", left: "12%", size: 110, opacity: 0.07, rotate: "-15deg", type: "fill" },
    { top: "82%", left: "68%", size: 150, opacity: 0.05, rotate: "30deg", type: "outline" },
    { top: "90%", left: "36%", size: 80, opacity: 0.09, rotate: "-25deg", type: "fill" },
  ];

  return (
    <>
      {dodecagons.map((d, i) => (
        <View key={i} style={{
          position: "absolute", top: d.top as any, left: d.left as any,
          width: d.size, height: d.size, opacity: d.opacity, transform: [{ rotate: d.rotate }],
        }}>
          <Svg width={d.size} height={d.size} viewBox={`0 0 ${d.size} ${d.size}`}>
            <Polygon points={getDodecagonPoints(d.size)} fill={d.type === "fill" ? c : "none"} stroke={d.type === "outline" ? c : "none"} strokeWidth={d.type === "outline" ? 2.5 : 0} />
          </Svg>
        </View>
      ))}
    </>
  );
}
