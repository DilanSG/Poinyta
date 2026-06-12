import { View } from "react-native";
import Svg, { Polygon } from "react-native-svg";
import { ThemeColors } from "../../lib/theme";

// Genera los puntos de una estrella de 5 puntas dentro de un viewBox cuadrado
const getStarPoints = (size: number): string => {
  const cx = size / 2;
  const cy = size / 2;
  const outerR = size / 2;
  const innerR = outerR * 0.382;
  const outerAngles = [270, 342, 54, 126, 198];
  const innerAngles = [306, 18, 90, 162, 234];
  const points: string[] = [];
  for (let i = 0; i < 5; i++) {
    const outerRad = (outerAngles[i] * Math.PI) / 180;
    const innerRad = (innerAngles[i] * Math.PI) / 180;
    points.push(
      `${cx + outerR * Math.cos(outerRad)},${cy + outerR * Math.sin(outerRad)}`
    );
    points.push(
      `${cx + innerR * Math.cos(innerRad)},${cy + innerR * Math.sin(innerRad)}`
    );
  }
  return points.join(" ");
};

// Datos de cada estrella: posición, tamaño, opacidad y rotación
const stars = [
  // Esquina superior izquierda
  { top: "2%", left: "4%", size: 38, opacity: 0.08, rotate: "15deg" },
  { top: "8%", left: "14%", size: 24, opacity: 0.11, rotate: "-8deg" },
  { top: "4%", left: "28%", size: 32, opacity: 0.07, rotate: "32deg" },
  { top: "1%", left: "42%", size: 18, opacity: 0.13, rotate: "5deg" },
  // Zona superior derecha
  { top: "5%", right: "18%", size: 28, opacity: 0.09, rotate: "-20deg" },
  { top: "12%", right: "5%", size: 44, opacity: 0.06, rotate: "25deg" },
  { top: "18%", right: "25%", size: 22, opacity: 0.1, rotate: "-12deg" },
  // Centro-izquierda
  { top: "22%", left: "6%", size: 36, opacity: 0.08, rotate: "40deg" },
  { top: "28%", left: "19%", size: 16, opacity: 0.14, rotate: "-30deg" },
  { top: "33%", left: "35%", size: 30, opacity: 0.1, rotate: "10deg" },
  // Centro-derecha
  { top: "26%", right: "12%", size: 42, opacity: 0.07, rotate: "-5deg" },
  { top: "38%", right: "4%", size: 26, opacity: 0.12, rotate: "18deg" },
  { top: "45%", right: "20%", size: 34, opacity: 0.09, rotate: "-28deg" },
  // Mitad inferior izquierda
  { top: "52%", left: "8%", size: 28, opacity: 0.11, rotate: "22deg" },
  { top: "58%", left: "22%", size: 20, opacity: 0.08, rotate: "-17deg" },
  { top: "65%", left: "4%", size: 38, opacity: 0.07, rotate: "35deg" },
  { top: "72%", left: "30%", size: 24, opacity: 0.13, rotate: "-9deg" },
  // Mitad inferior derecha
  { top: "55%", right: "10%", size: 32, opacity: 0.09, rotate: "14deg" },
  { top: "60%", right: "25%", size: 18, opacity: 0.12, rotate: "-33deg" },
  { top: "70%", right: "5%", size: 46, opacity: 0.06, rotate: "8deg" },
  // Zona inferior central
  { top: "78%", left: "42%", size: 26, opacity: 0.1, rotate: "-21deg" },
  { top: "85%", left: "15%", size: 34, opacity: 0.08, rotate: "27deg" },
  { top: "90%", left: "35%", size: 20, opacity: 0.11, rotate: "-6deg" },
  { top: "82%", right: "18%", size: 30, opacity: 0.09, rotate: "16deg" },
];

export default function StarsBg({ colors }: { colors: ThemeColors }) {
  const c = colors.primary;

  return (
    <>
      {stars.map((star, index) => (
        <View
          key={index}
          style={{
            position: "absolute",
            // React Native no acepta porcentajes en estilos, así que los convertimos a números usando 'as any'
            top: star.top as any,
            left: star.left as any,
            right: star.right as any,
            width: star.size,
            height: star.size,
            opacity: star.opacity,
            transform: [{ rotate: star.rotate }],
          }}
        >
          <Svg width="100%" height="100%" viewBox={`0 0 ${star.size} ${star.size}`}>
            <Polygon points={getStarPoints(star.size)} fill={c} />
          </Svg>
        </View>
      ))}
    </>
  );
}