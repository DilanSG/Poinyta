import { View } from "react-native";
import Svg, { Polygon } from "react-native-svg";
import { ThemeColors } from "../../lib/theme";

export default function TrianglesBg({ colors }: { colors: ThemeColors }) {
  const c = colors.primary;

  // Triángulos: cada uno tiene posición absoluta, tamaño, rotación y estilo
  // Los tipos: 'filled' (relleno con opacidad) o 'stroke' (solo borde)
  const triangles = [
    // Filled
    { x: "5%", y: "3%", width: 80, height: 70, rotate: "15deg", type: "filled", opacity: 0.08 },
    { x: "80%", y: "10%", width: 100, height: 86, rotate: "-10deg", type: "filled", opacity: 0.07 },
    { x: "15%", y: "40%", width: 60, height: 52, rotate: "45deg", type: "filled", opacity: 0.1 },
    { x: "70%", y: "55%", width: 120, height: 104, rotate: "20deg", type: "filled", opacity: 0.06 },
    { x: "40%", y: "75%", width: 70, height: 61, rotate: "-30deg", type: "filled", opacity: 0.09 },
    { x: "10%", y: "85%", width: 90, height: 78, rotate: "5deg", type: "filled", opacity: 0.07 },
    // Stroke (solo borde)
    { x: "60%", y: "4%", width: 110, height: 95, rotate: "35deg", type: "stroke", opacity: 0.1, strokeWidth: 2 },
    { x: "25%", y: "20%", width: 70, height: 60, rotate: "-20deg", type: "stroke", opacity: 0.08, strokeWidth: 2.5 },
    { x: "85%", y: "35%", width: 80, height: 69, rotate: "10deg", type: "stroke", opacity: 0.07, strokeWidth: 2 },
    { x: "45%", y: "50%", width: 100, height: 86, rotate: "60deg", type: "stroke", opacity: 0.09, strokeWidth: 2 },
    { x: "5%", y: "65%", width: 65, height: 56, rotate: "-15deg", type: "stroke", opacity: 0.08, strokeWidth: 2.5 },
    { x: "50%", y: "88%", width: 85, height: 74, rotate: "25deg", type: "stroke", opacity: 0.07, strokeWidth: 2 },
  ];

  return (
    <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, overflow: "hidden" }}>
      {triangles.map((t, i) => {
        // Calculamos los puntos de un triángulo equilátero dentro del ancho y alto
        const halfWidth = t.width / 2;
        const points = `0,${t.height} ${halfWidth},0 ${t.width},${t.height}`;

        return (
          <Svg
            key={i}
            style={{
              position: "absolute",
              top: t.y,
              left: t.x,
              transform: [{ rotate: t.rotate }],
            }}
            width={t.width}
            height={t.height}
            viewBox={`0 0 ${t.width} ${t.height}`}
          >
            <Polygon
              points={points}
              fill={t.type === "filled" ? c : "transparent"}
              stroke={t.type === "stroke" ? c : "none"}
              strokeWidth={t.type === "stroke" ? t.strokeWidth : 0}
              opacity={t.opacity}
            />
          </Svg>
        );
      })}
    </View>
  );
}