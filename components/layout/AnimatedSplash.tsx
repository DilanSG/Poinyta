import { useEffect, useRef } from "react";
import { StyleSheet, Animated, View, Easing, Dimensions } from "react-native";
import Svg, { Defs, LinearGradient, RadialGradient, Stop, Rect, Path } from "react-native-svg";
import { useTheme, ThemeColors } from "../../lib/theme";

type Props = {
  onHidden: () => void;
};

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");
const ORBIT_R = 72;
const ORBIT_STROKE = 6;
const BALL_SIZE = 14;
const P_SIZE = 220;
const DURACION_ENTRADA = 700;
const DURACION_MANTENER = 750;
const DURACION_FADE = 380;

type BgShape = {
  type: "triangle" | "diamond" | "hexagon" | "circle";
  size: number;
  colorKey: keyof Pick<ThemeColors, "primary" | "accentBlue" | "success" | "warning" | "error">;
  top: number;
  left: number;
  driftX: number;
  driftY: number;
  delay: number;
};

const BG_SHAPES: BgShape[] = [
  { type: "diamond", size: 120, colorKey: "primary", top: -30, left: -40, driftX: 12, driftY: 8, delay: 0 },
  { type: "hexagon", size: 100, colorKey: "accentBlue", top: SCREEN_H * 0.1, left: SCREEN_W * 0.65, driftX: -8, driftY: 6, delay: 120 },
  { type: "circle", size: 140, colorKey: "success", top: SCREEN_H * 0.25, left: SCREEN_W * 0.02, driftX: 10, driftY: -6, delay: 200 },
  { type: "triangle", size: 110, colorKey: "warning", top: -50, left: SCREEN_W * 0.35, driftX: -7, driftY: 10, delay: 80 },
  { type: "diamond", size: 90, colorKey: "error", top: SCREEN_H * 0.4, left: SCREEN_W * 0.7, driftX: -6, driftY: -8, delay: 250 },
  { type: "hexagon", size: 130, colorKey: "primary", top: SCREEN_H * 0.6, left: SCREEN_W * 0.05, driftX: 8, driftY: -5, delay: 160 },
  { type: "circle", size: 100, colorKey: "accentBlue", top: SCREEN_H * 0.75, left: SCREEN_W * 0.55, driftX: -5, driftY: 7, delay: 100 },
  { type: "diamond", size: 110, colorKey: "success", top: SCREEN_H * 0.5, left: SCREEN_W * 0.85, driftX: -9, driftY: -4, delay: 220 },
  { type: "triangle", size: 95, colorKey: "error", top: SCREEN_H * 0.88, left: SCREEN_W * 0.25, driftX: 6, driftY: -7, delay: 180 },
];

function renderBgShape(type: string, color: string, size: number) {
  const s = size;
  switch (type) {
    case "triangle":
      return (
        <View
          style={{
            width: 0,
            height: 0,
            borderLeftWidth: s * 0.5,
            borderRightWidth: s * 0.5,
            borderBottomWidth: s,
            borderLeftColor: "transparent",
            borderRightColor: "transparent",
            borderBottomColor: color,
          }}
        />
      );
    case "diamond":
      return (
        <View
          style={{
            width: s,
            height: s,
            backgroundColor: color,
            transform: [{ rotate: "45deg" }],
          }}
        />
      );
    case "hexagon":
      return (
        <View
          style={{
            width: s,
            height: s,
            backgroundColor: color,
            borderRadius: 6,
            transform: [{ rotate: "30deg" }],
          }}
        />
      );
    case "circle":
      return (
        <View
          style={{
            width: s,
            height: s,
            borderRadius: s / 2,
            backgroundColor: color,
          }}
        />
      );
    default:
      return null;
  }
}

export default function AnimatedSplash({ onHidden }: Props) {
  const colors = useTheme();
  const styles = getStyles(colors);

  const containerOpacity = useRef(new Animated.Value(1)).current;
  const orbitAngle = useRef(new Animated.Value(0)).current;
  const pFall = useRef(new Animated.Value(-P_SIZE * 2)).current;
  const pOpacity = useRef(new Animated.Value(0)).current;
  const driftAnims = useRef(BG_SHAPES.map(() => new Animated.ValueXY({ x: 0, y: 0 }))).current;

  useEffect(() => {
    const orbitAnim = Animated.timing(orbitAngle, {
      toValue: 1,
      duration: DURACION_ENTRADA + DURACION_MANTENER,
      easing: Easing.linear,
      useNativeDriver: true,
    });

    const pAnim = Animated.parallel([
      Animated.timing(pFall, {
        toValue: 0,
        duration: 550,
        easing: Easing.out(Easing.back(1.3)),
        useNativeDriver: true,
      }),
      Animated.timing(pOpacity, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
    ]);

    const driftAnimsList = BG_SHAPES.map((s, i) =>
      Animated.timing(driftAnims[i], {
        toValue: { x: s.driftX, y: s.driftY },
        duration: 3000,
        easing: Easing.inOut(Easing.sin),
        delay: s.delay,
        useNativeDriver: true,
      })
    );

    Animated.parallel([orbitAnim, pAnim, ...driftAnimsList]).start();

    const fadeTimer = setTimeout(() => {
      Animated.timing(containerOpacity, {
        toValue: 0,
        duration: DURACION_FADE,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start(() => onHidden());
    }, DURACION_ENTRADA + DURACION_MANTENER);

    return () => clearTimeout(fadeTimer);
  }, [onHidden, orbitAngle, pFall, pOpacity, containerOpacity, driftAnims]);

  const spin = orbitAngle.interpolate({
    inputRange: [0, 1],
    outputRange: ["45deg", "405deg"],
  });

  const ballOpacity = orbitAngle.interpolate({
    inputRange: [0, 0.52, 0.54, 0.70, 0.72, 1],
    outputRange: [0.9, 0.9, 0, 0, 0.9, 0.9],
  });

  return (
    <Animated.View style={[styles.container, { opacity: containerOpacity }]}>
      {/* Glow central */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Svg width={SCREEN_W} height={SCREEN_H}>
          <Defs>
            <RadialGradient id="centerGlow" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor={colors.primary} stopOpacity="0.06" />
              <Stop offset="60%" stopColor={colors.primary} stopOpacity="0.015" />
              <Stop offset="100%" stopColor={colors.primary} stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Rect x="0" y="0" width={SCREEN_W} height={SCREEN_H} fill="url(#centerGlow)" />
        </Svg>
      </View>

      {/* Figuras geometricas gigantes de fondo uniformemente distribuidas */}
      {BG_SHAPES.map((s, i) => {
        const colorMap: Record<string, string> = {
          primary: colors.primary,
          accentBlue: colors.accentBlue,
          success: colors.success,
          warning: colors.warning,
          error: colors.error,
        };
        return (
          <Animated.View
            key={i}
            style={[
              styles.bgShape,
              {
                top: s.top,
                left: s.left,
                opacity: 0.025,
                transform: [
                  { translateX: driftAnims[i].x },
                  { translateY: driftAnims[i].y },
                ],
              },
            ]}
            pointerEvents="none"
          >
            {renderBgShape(s.type, colorMap[s.colorKey], s.size)}
          </Animated.View>
        );
      })}

      {/* Orbita principal - arco con hueco en la izq y brillo en la der */}
      <View style={[StyleSheet.absoluteFill, { alignItems: "center", justifyContent: "center" }]} pointerEvents="none">
        <Svg width={ORBIT_R * 2 + ORBIT_STROKE * 2} height={ORBIT_R * 2 + ORBIT_STROKE * 2}>
          <Defs>
            <LinearGradient id="orbitGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <Stop offset="0%" stopColor={colors.primary} stopOpacity="0.1" />
              <Stop offset="50%" stopColor={colors.primary} stopOpacity="0.2" />
              <Stop offset="80%" stopColor={colors.primary} stopOpacity="0.5" />
              <Stop offset="100%" stopColor={colors.primary} stopOpacity="0.95" />
            </LinearGradient>
          </Defs>
          {/* Capa de brillo - lado derecho */}
          <Path
            d="M 132.9 31.1 A 72 72 0 0 1 132.9 132.9"
            fill="none"
            stroke={colors.primary}
            strokeWidth={ORBIT_STROKE * 2.5}
            strokeLinecap="round"
            opacity={0.08}
          />
          {/* Arco principal con degradado */}
          <Path
            d="M 19.6 46 A 72 72 0 1 1 19.6 118"
            fill="none"
            stroke="url(#orbitGrad)"
            strokeWidth={ORBIT_STROKE}
            strokeLinecap="round"
          />
        </Svg>
      </View>

      {/* Bolita orbitando sobre la orbita */}
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          {
            transform: [{ rotate: spin }],
            alignItems: "center",
            justifyContent: "center",
          },
        ]}
        pointerEvents="none"
      >
        <Animated.View
          style={{
            width: BALL_SIZE,
            height: BALL_SIZE,
            borderRadius: BALL_SIZE / 2,
            backgroundColor: colors.primary,
            opacity: ballOpacity,
            transform: [{ translateY: -ORBIT_R }],
          }}
        />
      </Animated.View>

      {/* P cayendo al centro */}
      <Animated.View
        style={[
          styles.pWrap,
          {
            opacity: pOpacity,
            transform: [{ translateY: pFall }],
            marginTop: P_SIZE / 7,
            marginLeft: P_SIZE / 18, 
          },
        ]}
      >
        <Svg width={P_SIZE} height={P_SIZE} viewBox="0 0 1000 1000">
          <Path
            d="M 325 740 L 325 390 C 325 280, 515 260, 595 360 C 675 460, 595 580, 495 580 L 425 580"
            fill="none"
            stroke={colors.primary}
            strokeWidth={36}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={0.9}
          />
        </Svg>
      </Animated.View>
    </Animated.View>
  );
}

const getStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: colors.background,
      justifyContent: "center",
      alignItems: "center",
      zIndex: 99999,
    },
    bgShape: {
      position: "absolute",
      alignItems: "center",
      justifyContent: "center",
    },
    pWrap: {
      ...StyleSheet.absoluteFillObject,
      alignItems: "center",
      justifyContent: "center",
    },
  });

export { AnimatedSplash };
