import { View } from "react-native";
import Svg, { Polygon } from "react-native-svg";
import { ThemeColors } from "../../lib/theme";

const getHexagonPoints = (size: number): string => {
  const cx = size / 2;
  const cy = size / 2;
  const R = size / 2;
  const cos30 = Math.cos(Math.PI / 6);
  const sin30 = Math.sin(Math.PI / 6);

  const p1 = `${cx},${cy - R}`;
  const p2 = `${cx + R * cos30},${cy - R * sin30}`;
  const p3 = `${cx + R * cos30},${cy + R * sin30}`;
  const p4 = `${cx},${cy + R}`;
  const p5 = `${cx - R * cos30},${cy + R * sin30}`;
  const p6 = `${cx - R * cos30},${cy - R * sin30}`;

  return `${p1} ${p2} ${p3} ${p4} ${p5} ${p6}`;
};

type Hexagon = {
  top: `${number}%`;
  left?: `${number}%`;
  right?: `${number}%`;
  size: number;
  type: "fill" | "outline";
  opacity: number;
  rotate: string;
};

const hexagons: Hexagon[] = [
  { top: "2%", left: "4%", size: 140, type: "outline", opacity: 0.06, rotate: "0deg" },
  { top: "4%", left: "30%", size: 110, type: "fill", opacity: 0.07, rotate: "30deg" },
  { top: "1%", right: "6%", size: 160, type: "outline", opacity: 0.05, rotate: "15deg" },
  { top: "14%", left: "8%", size: 90, type: "fill", opacity: 0.09, rotate: "-10deg" },
  { top: "16%", left: "50%", size: 130, type: "outline", opacity: 0.06, rotate: "45deg" },
  { top: "12%", right: "4%", size: 100, type: "fill", opacity: 0.08, rotate: "-25deg" },
  { top: "28%", left: "2%", size: 180, type: "outline", opacity: 0.05, rotate: "20deg" },
  { top: "30%", left: "24%", size: 120, type: "fill", opacity: 0.07, rotate: "-5deg" },
  { top: "26%", right: "10%", size: 150, type: "outline", opacity: 0.06, rotate: "35deg" },
  { top: "44%", left: "5%", size: 100, type: "fill", opacity: 0.08, rotate: "-15deg" },
  { top: "42%", left: "38%", size: 140, type: "outline", opacity: 0.06, rotate: "10deg" },
  { top: "40%", right: "4%", size: 170, type: "fill", opacity: 0.05, rotate: "-30deg" },
  { top: "56%", left: "3%", size: 130, type: "outline", opacity: 0.06, rotate: "25deg" },
  { top: "58%", left: "30%", size: 90, type: "fill", opacity: 0.09, rotate: "-20deg" },
  { top: "54%", right: "8%", size: 160, type: "outline", opacity: 0.05, rotate: "5deg" },
  { top: "72%", left: "6%", size: 110, type: "fill", opacity: 0.07, rotate: "40deg" },
  { top: "74%", left: "40%", size: 150, type: "outline", opacity: 0.06, rotate: "-12deg" },
  { top: "70%", right: "4%", size: 130, type: "fill", opacity: 0.07, rotate: "18deg" },
  { top: "86%", left: "10%", size: 100, type: "outline", opacity: 0.08, rotate: "-35deg" },
  { top: "88%", right: "8%", size: 140, type: "fill", opacity: 0.06, rotate: "22deg" },
];

export default function HexagonsBg({ colors }: { colors: ThemeColors }) {
  const c = colors.primary;
  return (
    <>
      {hexagons.map((hex, index) => (
        <View key={index} style={{
          position: "absolute", top: hex.top as any, left: hex.left as any, right: hex.right as any,
          width: hex.size, height: hex.size, opacity: hex.opacity, transform: [{ rotate: hex.rotate }],
        }}>
          <Svg width="100%" height="100%" viewBox={`0 0 ${hex.size} ${hex.size}`}>
            <Polygon points={getHexagonPoints(hex.size)} fill={hex.type === "fill" ? c : "none"} stroke={hex.type === "outline" ? c : "none"} strokeWidth={2.5} />
          </Svg>
        </View>
      ))}
    </>
  );
}
