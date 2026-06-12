import { useWindowDimensions, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { ThemeColors } from "../../lib/theme";

export default function WavesBg({ colors }: { colors: ThemeColors }) {
  const { width: screenWidth } = useWindowDimensions();
  const c = colors.primary;

  // Genera una ola con múltiples arcos usando curvas cúbicas
  const generateWavePath = (
    width: number,
    height: number,
    amplitude: number,
    cycles: number,
    phase: number
  ): string => {
    const step = width / (cycles * 4); // puntos de control cada cuarto de ciclo
    let path = `M0,${height / 2}`;

    for (let x = 0; x <= width; x += step) {
      const t = (x / width) * Math.PI * 2 * cycles + phase;
      const y = height / 2 + Math.sin(t) * amplitude;
      if (x === 0) continue;
      const prevX = x - step;
      const prevT = ((prevX / width) * Math.PI * 2 * cycles + phase);
      const prevY = height / 2 + Math.sin(prevT) * amplitude;
      // Control points para suavizado (derivada aproximada)
      const cp1x = prevX + step * 0.33;
      const cp1y = prevY;
      const cp2x = x - step * 0.33;
      const cp2y = y;
      path += ` C${cp1x},${cp1y} ${cp2x},${cp2y} ${x},${y}`;
    }
    return path;
  };

  // Configuración de olas: cada una con posición vertical (%), amplitud (px), ciclos, fase, opacidad y grosor
  const wavesConfig = [
    { top: 5, amplitude: 12, cycles: 2.2, phase: 0.0, opacity: 0.07, strokeWidth: 1.8 },
    { top: 15, amplitude: 18, cycles: 1.8, phase: 1.2, opacity: 0.09, strokeWidth: 2.0 },
    { top: 27, amplitude: 22, cycles: 2.5, phase: 2.5, opacity: 0.06, strokeWidth: 2.5 },
    { top: 38, amplitude: 14, cycles: 2.0, phase: 3.0, opacity: 0.08, strokeWidth: 1.5 },
    { top: 50, amplitude: 26, cycles: 2.8, phase: 0.8, opacity: 0.05, strokeWidth: 2.2 },
    { top: 62, amplitude: 16, cycles: 1.5, phase: 2.0, opacity: 0.10, strokeWidth: 1.6 },
    { top: 74, amplitude: 20, cycles: 2.3, phase: 4.0, opacity: 0.07, strokeWidth: 2.0 },
    { top: 85, amplitude: 24, cycles: 2.1, phase: 1.5, opacity: 0.06, strokeWidth: 2.4 },
    { top: 95, amplitude: 10, cycles: 1.9, phase: 3.5, opacity: 0.09, strokeWidth: 1.5 },
  ];

  // Altura de cada SVG (suficiente para contener la amplitud máxima)
  const svgHeight = 60; // en píxeles, las amplitudes están entre 10 y 26, sobran márgenes

  return (
    <>
      {wavesConfig.map((wave, idx) => {
        const path = generateWavePath(
          screenWidth,
          svgHeight,
          wave.amplitude,
          wave.cycles,
          wave.phase
        );

        return (
          <View
            key={idx}
            style={{
              position: "absolute",
              top: `${wave.top}%`,
              left: 0,
              right: 0,
              width: "100%",
              height: svgHeight,
              opacity: wave.opacity,
              transform: [{ translateY: -svgHeight / 2 }], // centra la ola respecto a su posición top
            }}
            pointerEvents="none"
          >
            <Svg width="100%" height={svgHeight} viewBox={`0 0 ${screenWidth} ${svgHeight}`}>
              <Path
                d={path}
                fill="none"
                stroke={c}
                strokeWidth={wave.strokeWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </View>
        );
      })}
    </>
  );
}