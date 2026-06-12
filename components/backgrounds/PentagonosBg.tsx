import { View } from "react-native";
import Svg, { Polygon } from "react-native-svg";
import { ThemeColors } from "../../lib/theme";

// Calcula los puntos de un pentágono regular inscrito en un cuadrado de lado `size`
const getPentagonPoints = (size: number): string => {
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2;
  // Vértices empezando desde arriba (‑90°), en sentido horario
  const angles = [270, 342, 54, 126, 198].map((deg) => (deg * Math.PI) / 180);
  return angles
    .map((a) => `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`)
    .join(" ");
};

export default function PentagonosBg({ colors }: { colors: ThemeColors }) {
  const c = colors.primary;

  return (
    <>
      {/* Pentágono relleno - esquina superior izquierda */}
      <View
        style={{
          position: "absolute",
          top: "4%",
          left: "6%",
          width: 130,
          height: 130,
          opacity: 0.1,
          transform: [{ rotate: "45deg" }],
        }}
      >
        <Svg width={130} height={130} viewBox="0 0 130 130">
          <Polygon points={getPentagonPoints(130)} fill={c} />
        </Svg>
      </View>

      {/* Pentágono con borde - esquina superior derecha */}
      <View
        style={{
          position: "absolute",
          top: "3%",
          right: "10%",
          width: 104,
          height: 104,
          opacity: 0.09,
          transform: [{ rotate: "15deg" }],
        }}
      >
        <Svg width={104} height={104} viewBox="0 0 104 104">
          <Polygon
            points={getPentagonPoints(104)}
            fill="none"
            stroke={c}
            strokeWidth={3}
          />
        </Svg>
      </View>

      {/* Pentágono relleno - centro superior */}
      <View
        style={{
          position: "absolute",
          top: "14%",
          left: "28%",
          width: 72,
          height: 72,
          opacity: 0.12,
          transform: [{ rotate: "60deg" }],
        }}
      >
        <Svg width={72} height={72} viewBox="0 0 72 72">
          <Polygon points={getPentagonPoints(72)} fill={c} />
        </Svg>
      </View>

      {/* Pentágono con borde - lado derecho */}
      <View
        style={{
          position: "absolute",
          top: "22%",
          right: "5%",
          width: 144,
          height: 144,
          opacity: 0.08,
          transform: [{ rotate: "-20deg" }],
        }}
      >
        <Svg width={144} height={144} viewBox="0 0 144 144">
          <Polygon
            points={getPentagonPoints(144)}
            fill="none"
            stroke={c}
            strokeWidth={2.5}
          />
        </Svg>
      </View>

      {/* Pentágono relleno - centro izquierda */}
      <View
        style={{
          position: "absolute",
          top: "35%",
          left: "4%",
          width: 92,
          height: 92,
          opacity: 0.09,
          transform: [{ rotate: "30deg" }],
        }}
      >
        <Svg width={92} height={92} viewBox="0 0 92 92">
          <Polygon points={getPentagonPoints(92)} fill={c} />
        </Svg>
      </View>

      {/* Pentágono con borde - centro */}
      <View
        style={{
          position: "absolute",
          top: "38%",
          left: "38%",
          width: 58,
          height: 58,
          opacity: 0.1,
          transform: [{ rotate: "50deg" }],
        }}
      >
        <Svg width={58} height={58} viewBox="0 0 58 58">
          <Polygon
            points={getPentagonPoints(58)}
            fill="none"
            stroke={c}
            strokeWidth={2}
          />
        </Svg>
      </View>

      {/* Pentágono relleno - centro derecha */}
      <View
        style={{
          position: "absolute",
          top: "45%",
          right: "8%",
          width: 118,
          height: 118,
          opacity: 0.08,
          transform: [{ rotate: "-10deg" }],
        }}
      >
        <Svg width={118} height={118} viewBox="0 0 118 118">
          <Polygon points={getPentagonPoints(118)} fill={c} />
        </Svg>
      </View>

      {/* Pentágono con borde - inferior izquierda */}
      <View
        style={{
          position: "absolute",
          bottom: "28%",
          left: "8%",
          width: 130,
          height: 130,
          opacity: 0.08,
          transform: [{ rotate: "40deg" }],
        }}
      >
        <Svg width={130} height={130} viewBox="0 0 130 130">
          <Polygon
            points={getPentagonPoints(130)}
            fill="none"
            stroke={c}
            strokeWidth={3}
          />
        </Svg>
      </View>

      {/* Pentágono relleno - centro inferior */}
      <View
        style={{
          position: "absolute",
          bottom: "12%",
          left: "35%",
          width: 78,
          height: 78,
          opacity: 0.11,
          transform: [{ rotate: "-25deg" }],
        }}
      >
        <Svg width={78} height={78} viewBox="0 0 78 78">
          <Polygon points={getPentagonPoints(78)} fill={c} />
        </Svg>
      </View>

      {/* Pentágono con borde - inferior derecha */}
      <View
        style={{
          position: "absolute",
          bottom: "8%",
          right: "6%",
          width: 156,
          height: 156,
          opacity: 0.07,
          transform: [{ rotate: "25deg" }],
        }}
      >
        <Svg width={156} height={156} viewBox="0 0 156 156">
          <Polygon
            points={getPentagonPoints(156)}
            fill="none"
            stroke={c}
            strokeWidth={2.5}
          />
        </Svg>
      </View>

      {/* Pequeños rellenos - dispersos */}
      <View
        style={{
          position: "absolute",
          top: "55%",
          left: "50%",
          width: 42,
          height: 42,
          opacity: 0.1,
          transform: [{ rotate: "70deg" }],
        }}
      >
        <Svg width={42} height={42} viewBox="0 0 42 42">
          <Polygon points={getPentagonPoints(42)} fill={c} />
        </Svg>
      </View>

      <View
        style={{
          position: "absolute",
          top: "68%",
          left: "22%",
          width: 52,
          height: 52,
          opacity: 0.09,
          transform: [{ rotate: "-35deg" }],
        }}
      >
        <Svg width={52} height={52} viewBox="0 0 52 52">
          <Polygon
            points={getPentagonPoints(52)}
            fill="none"
            stroke={c}
            strokeWidth={2}
          />
        </Svg>
      </View>

      <View
        style={{
          position: "absolute",
          top: "75%",
          left: "45%",
          width: 36,
          height: 36,
          opacity: 0.12,
          transform: [{ rotate: "55deg" }],
        }}
      >
        <Svg width={36} height={36} viewBox="0 0 36 36">
          <Polygon points={getPentagonPoints(36)} fill={c} />
        </Svg>
      </View>
    </>
  );
}