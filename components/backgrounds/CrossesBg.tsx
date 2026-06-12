import { useWindowDimensions, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { ThemeColors } from "../../lib/theme";

export default function CrossesBg({ colors }: { colors: ThemeColors }) {
  const { width, height } = useWindowDimensions();
  const c = colors.primary;

  // Configuración de la cuadrícula
  const cols = 5;       // número de columnas
  const rows = 7;       // número de filas
  const marginX = width * 0.05;
  const marginY = height * 0.05;
  const stepX = (width - marginX * 2) / (cols - 1);
  const stepY = (height - marginY * 2) / (rows - 1);

  // Generar cruces con variaciones armónicas
  const crosses = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      // Posición base
      let x = marginX + col * stepX;
      let y = marginY + row * stepY;

      // Desplazamiento aleatorio pero determinista (basado en fila/columna)
      const offsetX = (Math.sin(row * 1.7) * Math.cos(col * 2.3)) * stepX * 0.2;
      const offsetY = (Math.cos(row * 2.1) * Math.sin(col * 1.9)) * stepY * 0.2;
      x += offsetX;
      y += offsetY;

      // Tamaño base relativo al ancho de pantalla (entre 24 y 48 píxeles)
      const sizeBase = Math.min(width, height) * 0.06;
      const sizeVariation = Math.sin(row * 0.9 + col * 1.2) * 0.3 + 0.7; // 0.4..1.0
      let size = sizeBase * (0.7 + sizeVariation * 0.6);
      size = Math.min(70, Math.max(20, size));

      // Rotación armónica (entre -35° y 35°)
      const rotation = (Math.sin(row * 1.2 + col * 0.8) * 35) +
                       (Math.cos(col * 1.5) * 15);

      // Opacidad: mayor en el centro, menor en bordes
      const centerNorm = Math.abs(row - (rows-1)/2) / ((rows-1)/2);
      const edgeFactor = 1 - centerNorm * 0.5;
      const opacity = 0.06 + (Math.sin(row * 1.4 + col) * 0.04 + 0.05) * edgeFactor;
      const opacityClamped = Math.min(0.12, Math.max(0.05, opacity));

      // Grosor del trazo (entre 1.5 y 3)
      const strokeW = 1.5 + (Math.sin(row * 1.1 + col * 0.9) * 0.8 + 0.8) * 0.8;
      const strokeClamped = Math.min(3, Math.max(1.5, strokeW));

      crosses.push({
        x, y, size,
        rotation,
        opacity: opacityClamped,
        strokeWidth: strokeClamped,
      });
    }
  }

  // Genera el trazado SVG de una cruz (dos líneas perpendiculares centradas)
  const crossPath = (size: number, strokeWidth: number): string => {
    const half = size / 2;
    const offset = strokeWidth / 2;
    // Línea vertical: desde (half, 0) a (half, size)
    // Línea horizontal: desde (0, half) a (size, half)
    // Usamos un solo path con dos segmentos M.. L
    return `M${half},0 L${half},${size} M0,${half} L${size},${half}`;
  };

  return (
    <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, pointerEvents: "none" }}>
      {crosses.map((cr, idx) => (
        <View
          key={idx}
          style={{
            position: "absolute",
            left: cr.x - cr.size / 2,
            top: cr.y - cr.size / 2,
            width: cr.size,
            height: cr.size,
            transform: [{ rotate: `${cr.rotation}deg` }],
            opacity: cr.opacity,
          }}
        >
          <Svg width={cr.size} height={cr.size} viewBox={`0 0 ${cr.size} ${cr.size}`}>
            <Path
              d={crossPath(cr.size, cr.strokeWidth)}
              fill="none"
              stroke={c}
              strokeWidth={cr.strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </View>
      ))}
    </View>
  );
}