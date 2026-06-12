import { View } from "react-native";
import Svg, { Ellipse } from "react-native-svg";
import { ThemeColors } from "../../lib/theme";

type Ring = {
  top: `${number}%`;
  left?: `${number}%`;
  right?: `${number}%`;
  rx: number;
  ry: number;
  type: "fill" | "outline";
  opacity: number;
  rotate: string;
  strokeW: number;
};

const rings: Ring[] = [
  // ---- Zona superior izquierda ----
  { top: "3%", left: "5%", rx: 70, ry: 40, type: "outline", opacity: 0.06, rotate: "15deg", strokeW: 2.5 },
  { top: "6%", left: "28%", rx: 55, ry: 32, type: "fill", opacity: 0.07, rotate: "-25deg", strokeW: 0 },
  // ---- Zona superior central ----
  { top: "2%", left: "44%", rx: 90, ry: 50, type: "outline", opacity: 0.05, rotate: "8deg", strokeW: 3 },
  // ---- Zona superior derecha ----
  { top: "4%", right: "8%", rx: 65, ry: 35, type: "fill", opacity: 0.08, rotate: "-10deg", strokeW: 0 },
  { top: "12%", right: "20%", rx: 45, ry: 28, type: "outline", opacity: 0.09, rotate: "30deg", strokeW: 2 },
  // ---- Centro izquierda ----
  { top: "22%", left: "4%", rx: 80, ry: 45, type: "outline", opacity: 0.06, rotate: "-20deg", strokeW: 2.8 },
  { top: "28%", left: "18%", rx: 48, ry: 30, type: "fill", opacity: 0.1, rotate: "40deg", strokeW: 0 },
  // ---- Centro ----
  { top: "35%", left: "38%", rx: 60, ry: 38, type: "outline", opacity: 0.07, rotate: "12deg", strokeW: 2.2 },
  { top: "42%", left: "55%", rx: 52, ry: 36, type: "fill", opacity: 0.08, rotate: "-18deg", strokeW: 0 },
  // ---- Centro derecha ----
  { top: "20%", right: "5%", rx: 75, ry: 42, type: "outline", opacity: 0.06, rotate: "-35deg", strokeW: 3 },
  { top: "45%", right: "12%", rx: 55, ry: 32, type: "outline", opacity: 0.09, rotate: "25deg", strokeW: 2 },
  // ---- Mitad inferior izquierda ----
  { top: "55%", left: "8%", rx: 68, ry: 40, type: "fill", opacity: 0.07, rotate: "18deg", strokeW: 0 },
  { top: "62%", left: "28%", rx: 50, ry: 30, type: "outline", opacity: 0.1, rotate: "-30deg", strokeW: 2.5 },
  { top: "72%", left: "6%", rx: 85, ry: 48, type: "outline", opacity: 0.06, rotate: "5deg", strokeW: 2.8 },
  // ---- Mitad inferior derecha ----
  { top: "50%", right: "18%", rx: 62, ry: 36, type: "fill", opacity: 0.08, rotate: "-12deg", strokeW: 0 },
  { top: "65%", right: "4%", rx: 70, ry: 44, type: "outline", opacity: 0.07, rotate: "28deg", strokeW: 2.5 },
  { top: "78%", right: "16%", rx: 48, ry: 28, type: "fill", opacity: 0.09, rotate: "-22deg", strokeW: 0 },
  // ---- Zona inferior central ----
  { top: "82%", left: "42%", rx: 58, ry: 34, type: "outline", opacity: 0.08, rotate: "15deg", strokeW: 2 },
  { top: "88%", left: "12%", rx: 72, ry: 40, type: "outline", opacity: 0.06, rotate: "-8deg", strokeW: 3 },
  { top: "85%", right: "10%", rx: 64, ry: 38, type: "fill", opacity: 0.07, rotate: "32deg", strokeW: 0 },
];

export default function RingsBg({ colors }: { colors: ThemeColors }) {
  const c = colors.primary;

  return (
    <>
      {rings.map((ring, index) => {
        const width = ring.rx * 2;
        const height = ring.ry * 2;

        return (
          <View
            key={index}
            style={{
              position: "absolute",
              top: ring.top,
              left: ring.left,
              right: ring.right,
              width: width,
              height: height,
              opacity: ring.opacity,
              transform: [{ rotate: ring.rotate }],
            }}
          >
            <Svg
              width="100%"
              height="100%"
              viewBox={`0 0 ${width} ${height}`}
            >
              <Ellipse
                cx={ring.rx}
                cy={ring.ry}
                rx={ring.rx}
                ry={ring.ry}
                fill={ring.type === "fill" ? c : "none"}
                stroke={ring.type === "outline" ? c : "none"}
                strokeWidth={ring.strokeW || 0}
              />
            </Svg>
          </View>
        );
      })}
    </>
  );
}