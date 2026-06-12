import React, { useRef, useEffect, useCallback } from "react";
import { View, StyleSheet, Animated, Easing } from "react-native";
import { ThemeColors, useActiveBackgroundId, useMovementLayer } from "../../lib/theme";
import { getBackgroundById } from "../../lib/theme/presets/themes";
import CirclesBg from "../backgrounds/CirclesBg";
import DiamondsBg from "../backgrounds/DiamondsBg";
import TrianglesBg from "../backgrounds/TrianglesBg";
import RingsBg from "../backgrounds/RingsBg";
import MixedBg from "../backgrounds/MixedBg";
import DotsBg from "../backgrounds/DotsBg";
import PentagonosBg from "../backgrounds/PentagonosBg";
import HexagonsBg from "../backgrounds/HexagonsBg";
import StarsBg from "../backgrounds/StarsBg";
import FlatBg from "../backgrounds/FlatBg";
import CrossesBg from "../backgrounds/CrossesBg";
import WavesBg from "../backgrounds/WavesBg";
import SquaresBg from "../backgrounds/SquaresBg";
import ArrowsBg from "../backgrounds/ArrowsBg";
import CylindersBg from "../backgrounds/CylindersBg";
import HeptagonsBg from "../backgrounds/HeptagonsBg";
import OctagonsBg from "../backgrounds/OctagonsBg";
import NonagonsBg from "../backgrounds/NonagonsBg";
import DecagonsBg from "../backgrounds/DecagonsBg";
import DodecagonsBg from "../backgrounds/DodecagonsBg";

const BACKGROUND_COMPONENTS: Record<number, React.ComponentType<{ colors: ThemeColors }>> = {
  1: CirclesBg,
  2: DiamondsBg,
  3: TrianglesBg,
  4: RingsBg,
  5: MixedBg,
  6: DotsBg,
  7: PentagonosBg,
  8: HexagonsBg,
  9: StarsBg,
  10: FlatBg,
  11: CrossesBg,
  12: WavesBg,
  13: SquaresBg,
  14: ArrowsBg,
  15: CylindersBg,
  16: HeptagonsBg,
  17: OctagonsBg,
  18: NonagonsBg,
  19: DecagonsBg,
  20: DodecagonsBg,
};

export default function BackgroundDecor({
  colors,
  screenVariant = 0,
}: {
  colors: ThemeColors;
  screenVariant?: number;
}) {
  const activeBgId = useActiveBackgroundId();
  const c = colors.primary;
  const { movementLayerId, allMovementLayers } = useMovementLayer();
  const movementPreset = allMovementLayers.find((m) => m.id === movementLayerId);
  const animValue = useRef(new Animated.Value(0)).current;
  const stopRef = useRef<() => void>(() => {});

  const startLoop = useCallback(() => {
    if (!movementPreset || movementPreset.id === "none") return;

    const stops: (() => void)[] = [];
    const s = movementPreset.speed;

    switch (movementPreset.type) {
      case "temblor": {
        const h = Math.round(2000 / s);
        const anim = Animated.loop(Animated.sequence([
          Animated.timing(animValue, { toValue: 1, duration: h, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(animValue, { toValue: 0, duration: h, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ]));
        anim.start();
        stops.push(() => anim.stop());
        break;
      }
      case "marea": {
        const up = Math.round(6000 / s);
        const hold = Math.round(2500 / s);
        const down = Math.round(6000 / s);
        const anim = Animated.loop(Animated.sequence([
          Animated.timing(animValue, { toValue: 1, duration: up, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.delay(hold),
          Animated.timing(animValue, { toValue: 0, duration: down, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.delay(hold),
        ]));
        anim.start();
        stops.push(() => anim.stop());
        break;
      }
      case "cabeceo": {
        const fast = Math.round(3000 / s);
        const slow = Math.round(5000 / s);
        const anim = Animated.loop(Animated.sequence([
          Animated.timing(animValue, { toValue: 1, duration: fast, easing: Easing.out(Easing.ease), useNativeDriver: true }),
          Animated.timing(animValue, { toValue: 0, duration: slow, easing: Easing.in(Easing.ease), useNativeDriver: true }),
        ]));
        anim.start();
        stops.push(() => anim.stop());
        break;
      }
      case "respiro": {
        const inMs = Math.round(4000 / s);
        const outMs = Math.round(4000 / s);
        const anim = Animated.loop(Animated.sequence([
          Animated.timing(animValue, { toValue: 1, duration: inMs, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(animValue, { toValue: 0, duration: outMs, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ]));
        anim.start();
        stops.push(() => anim.stop());
        break;
      }
      case "vagar": {
        const h = Math.round(12000 / s);
        const anim = Animated.loop(Animated.sequence([
          Animated.timing(animValue, { toValue: 1, duration: h, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(animValue, { toValue: 0, duration: h, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ]));
        anim.start();
        stops.push(() => anim.stop());
        break;
      }
      case "zoom": {
        const h = Math.round(6000 / s);
        const anim = Animated.loop(Animated.sequence([
          Animated.timing(animValue, { toValue: 1, duration: h, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(animValue, { toValue: 0, duration: h, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ]));
        anim.start();
        stops.push(() => anim.stop());
        break;
      }
      case "elastico": {
        const h = Math.round(4000 / s);
        const anim = Animated.loop(Animated.sequence([
          Animated.timing(animValue, { toValue: 1, duration: h, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(animValue, { toValue: 0, duration: h, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ]));
        anim.start();
        stops.push(() => anim.stop());
        break;
      }
      case "balanceo": {
        const h = Math.round(5000 / s);
        const anim = Animated.loop(Animated.sequence([
          Animated.timing(animValue, { toValue: 1, duration: h, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(animValue, { toValue: 0, duration: h, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ]));
        anim.start();
        stops.push(() => anim.stop());
        break;
      }
      case "onda": {
        const h = Math.round(6000 / s);
        const anim = Animated.loop(Animated.sequence([
          Animated.timing(animValue, { toValue: 1, duration: h, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(animValue, { toValue: 0, duration: h, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ]));
        anim.start();
        stops.push(() => anim.stop());
        break;
      }
      case "latido": {
        const t1 = Math.round(150 / s);
        const t2 = Math.round(250 / s);
        const t3 = Math.round(150 / s);
        const t4 = Math.round(600 / s);
        const anim = Animated.loop(Animated.sequence([
          Animated.timing(animValue, { toValue: 0.5, duration: t1, easing: Easing.out(Easing.ease), useNativeDriver: true }),
          Animated.timing(animValue, { toValue: 0.15, duration: t2, easing: Easing.in(Easing.ease), useNativeDriver: true }),
          Animated.timing(animValue, { toValue: 0.4, duration: t3, easing: Easing.out(Easing.ease), useNativeDriver: true }),
          Animated.timing(animValue, { toValue: 0, duration: t4, easing: Easing.in(Easing.ease), useNativeDriver: true }),
        ]));
        anim.start();
        stops.push(() => anim.stop());
        break;
      }
      case "girar": {
        const h = Math.round(8000 / s);
        const anim = Animated.loop(
          Animated.timing(animValue, { toValue: 1, duration: h, easing: Easing.linear, useNativeDriver: true })
        );
        anim.start();
        stops.push(() => anim.stop());
        break;
      }
      case "flotar": {
        const h = Math.round(6000 / s);
        const anim = Animated.loop(Animated.sequence([
          Animated.timing(animValue, { toValue: 1, duration: h / 2, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(animValue, { toValue: 0, duration: h / 2, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ]));
        anim.start();
        stops.push(() => anim.stop());
        break;
      }
      case "rebote": {
        const h = Math.round(2000 / s);
        const anim = Animated.loop(
          Animated.sequence([
            Animated.timing(animValue, { toValue: 1, duration: h, easing: Easing.bounce, useNativeDriver: true }),
            Animated.delay(h),
          ])
        );
        anim.start();
        stops.push(() => anim.stop());
        break;
      }
      case "pendulo": {
        const h = Math.round(4000 / s);
        const anim = Animated.loop(Animated.sequence([
          Animated.timing(animValue, { toValue: 1, duration: h / 2, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(animValue, { toValue: 0, duration: h / 2, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ]));
        anim.start();
        stops.push(() => anim.stop());
        break;
      }
    }

    stopRef.current = () => stops.forEach((fn) => fn());
  }, [movementPreset?.id, movementPreset?.speed, animValue]);

  useEffect(() => {
    startLoop();
    return () => stopRef.current();
  }, [startLoop]);

  if (activeBgId === "flat") {
    return <View style={StyleSheet.absoluteFill} pointerEvents="none" />;
  }

  const bg = getBackgroundById(activeBgId);
  const Component = BACKGROUND_COMPONENTS[bg.variant];
  const hasMovement = movementPreset && movementPreset.id !== "none";

  let animatedStyle: any = {};
  if (hasMovement) {
    switch (movementPreset.type) {
      case "temblor":
        animatedStyle = {
          transform: [
            { translateX: animValue.interpolate({ inputRange: [0, 1], outputRange: [-6, 6] }) },
            { translateY: animValue.interpolate({ inputRange: [0, 1], outputRange: [-4, 4] }) },
            { rotate: animValue.interpolate({ inputRange: [0, 1], outputRange: ["-1deg", "1deg"] }) },
          ],
        };
        break;
      case "marea":
        animatedStyle = {
          transform: [
            { translateY: animValue.interpolate({ inputRange: [0, 1], outputRange: [-20, 20] }) },
          ],
        };
        break;
      case "cabeceo":
        animatedStyle = {
          transform: [
            { rotate: animValue.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "4deg"] }) },
          ],
        };
        break;
      case "respiro":
        animatedStyle = {
          transform: [
            { scale: animValue.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] }) },
          ],
          opacity: animValue.interpolate({ inputRange: [0, 1], outputRange: [1, 0.78] }),
        };
        break;
      case "vagar":
        animatedStyle = {
          transform: [
            { translateX: animValue.interpolate({ inputRange: [0, 1], outputRange: [-40, 40] }) },
          ],
        };
        break;
      case "zoom":
        animatedStyle = {
          transform: [
            { scale: animValue.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.1] }) },
          ],
        };
        break;
      case "elastico":
        animatedStyle = {
          transform: [
            { scaleX: animValue.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1.05] }) },
            { scaleY: animValue.interpolate({ inputRange: [0, 1], outputRange: [1.05, 0.95] }) },
          ],
        };
        break;
      case "balanceo":
        animatedStyle = {
          transform: [
            { skewX: animValue.interpolate({ inputRange: [0, 1], outputRange: ["-5deg", "5deg"] }) },
          ],
        };
        break;
      case "onda":
        animatedStyle = {
          transform: [
            { skewY: animValue.interpolate({ inputRange: [0, 1], outputRange: ["-4deg", "4deg"] }) },
          ],
        };
        break;
      case "latido":
        animatedStyle = {
          transform: [
            { scale: animValue.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 1.035, 1] }) },
          ],
          opacity: animValue.interpolate({ inputRange: [0, 0.15, 0.4, 0.5, 1], outputRange: [1, 0.96, 0.93, 0.9, 0.85] }),
        };
        break;
      case "girar":
        animatedStyle = {
          transform: [
            { rotate: animValue.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] }) },
          ],
        };
        break;
      case "flotar":
        animatedStyle = {
          transform: [
            { translateY: animValue.interpolate({ inputRange: [0, 1], outputRange: [0, -15] }) },
          ],
        };
        break;
      case "rebote":
        animatedStyle = {
          transform: [
            { translateY: animValue.interpolate({ inputRange: [0, 1], outputRange: [0, -30] }) },
          ],
        };
        break;
      case "pendulo":
        animatedStyle = {
          transform: [
            { rotate: animValue.interpolate({ inputRange: [0, 1], outputRange: ["-8deg", "8deg"] }) },
            { translateX: animValue.interpolate({ inputRange: [0, 1], outputRange: [-15, 15] }) },
          ],
        };
        break;
    }
  }

  if (Component) {
    return (
      <Animated.View style={[StyleSheet.absoluteFill, animatedStyle]} pointerEvents="none">
        <Component colors={colors} />
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[StyleSheet.absoluteFill, animatedStyle]} pointerEvents="none">
      {screenVariant === 0 && (
        <>
          <View
            style={{
              position: "absolute",
              top: "6%",
              right: "8%",
              width: 220,
              height: 220,
              backgroundColor: c,
              opacity: 0.08,
              transform: [{ rotate: "45deg" }],
            }}
          />
          <View
            style={{
              position: "absolute",
              top: "2%",
              left: "6%",
              width: 0,
              height: 0,
              borderLeftWidth: 55,
              borderRightWidth: 55,
              borderBottomWidth: 95,
              borderLeftColor: "transparent",
              borderRightColor: "transparent",
              borderBottomColor: c,
              opacity: 0.07,
              transform: [{ rotate: "-5deg" }],
            }}
          />
          <View
            style={{
              position: "absolute",
              top: "18%",
              left: "38%",
              width: 28,
              height: 28,
              borderRadius: 14,
              backgroundColor: c,
              opacity: 0.13,
            }}
          />
          <View
            style={{
              position: "absolute",
              top: "38%",
              right: "6%",
              width: 120,
              height: 120,
              borderRadius: 60,
              borderWidth: 3,
              borderColor: c,
              opacity: 0.1,
            }}
          />
          <View
            style={{
              position: "absolute",
              top: "45%",
              left: "3%",
              width: 70,
              height: 70,
              backgroundColor: c,
              opacity: 0.08,
              borderRadius: 14,
              transform: [{ rotate: "30deg" }],
            }}
          />
          <View
            style={{
              position: "absolute",
              top: "58%",
              left: "35%",
              width: 0,
              height: 0,
              borderLeftWidth: 30,
              borderRightWidth: 30,
              borderBottomWidth: 52,
              borderLeftColor: "transparent",
              borderRightColor: "transparent",
              borderBottomColor: c,
              opacity: 0.1,
              transform: [{ rotate: "-25deg" }],
            }}
          />
          <View
            style={{
              position: "absolute",
              bottom: "25%",
              right: "4%",
              width: 90,
              height: 90,
              borderRadius: 18,
              backgroundColor: c,
              opacity: 0.07,
              transform: [{ rotate: "60deg" }],
            }}
          />
          <View
            style={{
              position: "absolute",
              bottom: "8%",
              left: "10%",
              width: 130,
              height: 130,
              borderRadius: 65,
              borderWidth: 2.5,
              borderColor: c,
              opacity: 0.09,
            }}
          />
          <View
            style={{
              position: "absolute",
              bottom: "42%",
              left: "55%",
              width: 50,
              height: 50,
              borderRadius: 25,
              backgroundColor: c,
              opacity: 0.11,
            }}
          />
          <View
            style={{
              position: "absolute",
              top: "75%",
              left: "42%",
              width: 5,
              height: 80,
              borderRadius: 3,
              backgroundColor: c,
              opacity: 0.08,
              transform: [{ rotate: "15deg" }],
            }}
          />
        </>
      )}

      {screenVariant === 1 && (
        <>
          <View
            style={{
              position: "absolute",
              top: "4%",
              left: "7%",
              width: 160,
              height: 160,
              borderRadius: 80,
              backgroundColor: c,
              opacity: 0.07,
            }}
          />
          <View
            style={{
              position: "absolute",
              top: "1%",
              right: "5%",
              width: 0,
              height: 0,
              borderLeftWidth: 50,
              borderRightWidth: 50,
              borderBottomWidth: 86,
              borderLeftColor: "transparent",
              borderRightColor: "transparent",
              borderBottomColor: c,
              opacity: 0.07,
              transform: [{ rotate: "15deg" }],
            }}
          />
          <View
            style={{
              position: "absolute",
              top: "20%",
              right: "35%",
              width: 40,
              height: 40,
              borderRadius: 8,
              backgroundColor: c,
              opacity: 0.11,
              transform: [{ rotate: "45deg" }],
            }}
          />
          <View
            style={{
              position: "absolute",
              top: "35%",
              left: "4%",
              width: 100,
              height: 100,
              borderRadius: 20,
              backgroundColor: c,
              opacity: 0.07,
              transform: [{ rotate: "30deg" }],
            }}
          />
          <View
            style={{
              position: "absolute",
              top: "40%",
              right: "8%",
              width: 90,
              height: 90,
              borderRadius: 45,
              borderWidth: 2.5,
              borderColor: c,
              opacity: 0.1,
            }}
          />
          <View
            style={{
              position: "absolute",
              bottom: "30%",
              right: "30%",
              width: 60,
              height: 60,
              borderRadius: 30,
              backgroundColor: c,
              opacity: 0.09,
            }}
          />
          <View
            style={{
              position: "absolute",
              bottom: "10%",
              left: "5%",
              width: 0,
              height: 0,
              borderLeftWidth: 42,
              borderRightWidth: 42,
              borderBottomWidth: 72,
              borderLeftColor: "transparent",
              borderRightColor: "transparent",
              borderBottomColor: c,
              opacity: 0.08,
              transform: [{ rotate: "-30deg" }],
            }}
          />
          <View
            style={{
              position: "absolute",
              bottom: "5%",
              right: "6%",
              width: 140,
              height: 140,
              borderRadius: 28,
              borderWidth: 2.5,
              borderColor: c,
              opacity: 0.08,
              transform: [{ rotate: "60deg" }],
            }}
          />
          <View
            style={{
              position: "absolute",
              top: "60%",
              left: "42%",
              width: 35,
              height: 35,
              borderRadius: 18,
              backgroundColor: c,
              opacity: 0.12,
            }}
          />
          <View
            style={{
              position: "absolute",
              top: "80%",
              left: "25%",
              width: 4,
              height: 70,
              borderRadius: 2,
              backgroundColor: c,
              opacity: 0.08,
              transform: [{ rotate: "40deg" }],
            }}
          />
        </>
      )}

      {screenVariant === 2 && (
        <>
          <View
            style={{
              position: "absolute",
              top: "2%",
              left: "4%",
              width: 200,
              height: 200,
              borderRadius: 100,
              backgroundColor: c,
              opacity: 0.06,
            }}
          />
          <View
            style={{
              position: "absolute",
              top: "10%",
              right: "4%",
              width: 110,
              height: 110,
              backgroundColor: c,
              opacity: 0.08,
              transform: [{ rotate: "45deg" }],
            }}
          />
          <View
            style={{
              position: "absolute",
              top: "28%",
              left: "35%",
              width: 22,
              height: 22,
              borderRadius: 11,
              backgroundColor: c,
              opacity: 0.14,
            }}
          />
          <View
            style={{
              position: "absolute",
              top: "42%",
              left: "5%",
              width: 0,
              height: 0,
              borderLeftWidth: 45,
              borderRightWidth: 45,
              borderBottomWidth: 78,
              borderLeftColor: "transparent",
              borderRightColor: "transparent",
              borderBottomColor: c,
              opacity: 0.09,
              transform: [{ rotate: "-15deg" }],
            }}
          />
          <View
            style={{
              position: "absolute",
              top: "50%",
              right: "5%",
              width: 80,
              height: 80,
              borderRadius: 40,
              borderWidth: 2.5,
              borderColor: c,
              opacity: 0.1,
            }}
          />
          <View
            style={{
              position: "absolute",
              bottom: "25%",
              left: "8%",
              width: 90,
              height: 90,
              borderRadius: 18,
              backgroundColor: c,
              opacity: 0.07,
              transform: [{ rotate: "25deg" }],
            }}
          />
          <View
            style={{
              position: "absolute",
              bottom: "8%",
              right: "10%",
              width: 150,
              height: 150,
              borderRadius: 75,
              backgroundColor: c,
              opacity: 0.06,
            }}
          />
          <View
            style={{
              position: "absolute",
              bottom: "40%",
              left: "50%",
              width: 50,
              height: 50,
              borderRadius: 10,
              borderWidth: 2,
              borderColor: c,
              opacity: 0.11,
              transform: [{ rotate: "60deg" }],
            }}
          />
          <View
            style={{
              position: "absolute",
              top: "72%",
              left: "40%",
              width: 3,
              height: 100,
              borderRadius: 2,
              backgroundColor: c,
              opacity: 0.08,
              transform: [{ rotate: "-35deg" }],
            }}
          />
          <View
            style={{
              position: "absolute",
              bottom: "15%",
              left: "42%",
              width: 30,
              height: 30,
              borderRadius: 15,
              backgroundColor: c,
              opacity: 0.11,
            }}
          />
        </>
      )}

      {screenVariant === 3 && (
        <>
          <View
            style={{
              position: "absolute",
              top: "3%",
              right: "5%",
              width: 180,
              height: 180,
              backgroundColor: c,
              opacity: 0.07,
              transform: [{ rotate: "45deg" }],
            }}
          />
          <View
            style={{
              position: "absolute",
              top: "6%",
              left: "5%",
              width: 0,
              height: 0,
              borderLeftWidth: 45,
              borderRightWidth: 45,
              borderBottomWidth: 78,
              borderLeftColor: "transparent",
              borderRightColor: "transparent",
              borderBottomColor: c,
              opacity: 0.07,
              transform: [{ rotate: "10deg" }],
            }}
          />
          <View
            style={{
              position: "absolute",
              top: "24%",
              left: "28%",
              width: 34,
              height: 34,
              borderRadius: 17,
              backgroundColor: c,
              opacity: 0.12,
            }}
          />
          <View
            style={{
              position: "absolute",
              top: "38%",
              left: "4%",
              width: 130,
              height: 130,
              borderRadius: 65,
              borderWidth: 3,
              borderColor: c,
              opacity: 0.09,
            }}
          />
          <View
            style={{
              position: "absolute",
              top: "44%",
              right: "4%",
              width: 80,
              height: 80,
              backgroundColor: c,
              opacity: 0.07,
              borderRadius: 16,
              transform: [{ rotate: "20deg" }],
            }}
          />
          <View
            style={{
              position: "absolute",
              bottom: "20%",
              right: "25%",
              width: 55,
              height: 55,
              borderRadius: 28,
              backgroundColor: c,
              opacity: 0.1,
            }}
          />
          <View
            style={{
              position: "absolute",
              bottom: "6%",
              left: "8%",
              width: 0,
              height: 0,
              borderLeftWidth: 35,
              borderRightWidth: 35,
              borderBottomWidth: 60,
              borderLeftColor: "transparent",
              borderRightColor: "transparent",
              borderBottomColor: c,
              opacity: 0.09,
              transform: [{ rotate: "-20deg" }],
            }}
          />
          <View
            style={{
              position: "absolute",
              bottom: "4%",
              right: "6%",
              width: 120,
              height: 120,
              borderRadius: 24,
              borderWidth: 2.5,
              borderColor: c,
              opacity: 0.07,
              transform: [{ rotate: "40deg" }],
            }}
          />
          <View
            style={{
              position: "absolute",
              top: "65%",
              left: "44%",
              width: 6,
              height: 90,
              borderRadius: 3,
              backgroundColor: c,
              opacity: 0.08,
              transform: [{ rotate: "-10deg" }],
            }}
          />
          <View
            style={{
              position: "absolute",
              bottom: "44%",
              left: "55%",
              width: 40,
              height: 40,
              borderRadius: 8,
              backgroundColor: c,
              opacity: 0.1,
              transform: [{ rotate: "15deg" }],
            }}
          />
        </>
      )}

      {screenVariant === 4 && (
        <>
          <View
            style={{
              position: "absolute",
              top: "4%",
              right: "6%",
              width: 190,
              height: 190,
              borderRadius: 95,
              backgroundColor: c,
              opacity: 0.06,
            }}
          />
          <View
            style={{
              position: "absolute",
              top: "3%",
              left: "6%",
              width: 130,
              height: 130,
              backgroundColor: c,
              opacity: 0.07,
              transform: [{ rotate: "45deg" }],
            }}
          />
          <View
            style={{
              position: "absolute",
              top: "22%",
              right: "32%",
              width: 30,
              height: 30,
              borderRadius: 6,
              backgroundColor: c,
              opacity: 0.12,
              transform: [{ rotate: "20deg" }],
            }}
          />
          <View
            style={{
              position: "absolute",
              top: "40%",
              left: "5%",
              width: 0,
              height: 0,
              borderLeftWidth: 38,
              borderRightWidth: 38,
              borderBottomWidth: 65,
              borderLeftColor: "transparent",
              borderRightColor: "transparent",
              borderBottomColor: c,
              opacity: 0.08,
              transform: [{ rotate: "-5deg" }],
            }}
          />
          <View
            style={{
              position: "absolute",
              top: "48%",
              right: "6%",
              width: 100,
              height: 100,
              borderRadius: 50,
              borderWidth: 2.5,
              borderColor: c,
              opacity: 0.09,
            }}
          />
          <View
            style={{
              position: "absolute",
              bottom: "32%",
              left: "15%",
              width: 70,
              height: 70,
              borderRadius: 35,
              backgroundColor: c,
              opacity: 0.08,
            }}
          />
          <View
            style={{
              position: "absolute",
              bottom: "8%",
              left: "40%",
              width: 110,
              height: 110,
              borderRadius: 22,
              backgroundColor: c,
              opacity: 0.06,
              transform: [{ rotate: "30deg" }],
            }}
          />
          <View
            style={{
              position: "absolute",
              bottom: "5%",
              right: "8%",
              width: 80,
              height: 80,
              borderRadius: 40,
              borderWidth: 2.5,
              borderColor: c,
              opacity: 0.1,
            }}
          />
          <View
            style={{
              position: "absolute",
              top: "68%",
              left: "50%",
              width: 4,
              height: 80,
              borderRadius: 2,
              backgroundColor: c,
              opacity: 0.08,
              transform: [{ rotate: "50deg" }],
            }}
          />
          <View
            style={{
              position: "absolute",
              top: "78%",
              left: "20%",
              width: 25,
              height: 25,
              borderRadius: 13,
              backgroundColor: c,
              opacity: 0.13,
            }}
          />
        </>
      )}

      {screenVariant === 5 && (
        <>
          <View
            style={{
              position: "absolute",
              top: "3%",
              right: "5%",
              width: 170,
              height: 170,
              borderRadius: 85,
              backgroundColor: c,
              opacity: 0.07,
            }}
          />
          <View
            style={{
              position: "absolute",
              top: "5%",
              left: "4%",
              width: 110,
              height: 110,
              backgroundColor: c,
              opacity: 0.07,
              transform: [{ rotate: "45deg" }],
            }}
          />
          <View
            style={{
              position: "absolute",
              top: "22%",
              left: "40%",
              width: 18,
              height: 18,
              borderRadius: 9,
              backgroundColor: c,
              opacity: 0.15,
            }}
          />
          <View
            style={{
              position: "absolute",
              top: "36%",
              left: "6%",
              width: 0,
              height: 0,
              borderLeftWidth: 40,
              borderRightWidth: 40,
              borderBottomWidth: 70,
              borderLeftColor: "transparent",
              borderRightColor: "transparent",
              borderBottomColor: c,
              opacity: 0.08,
              transform: [{ rotate: "-10deg" }],
            }}
          />
          <View
            style={{
              position: "absolute",
              top: "42%",
              right: "5%",
              width: 90,
              height: 90,
              borderRadius: 18,
              backgroundColor: c,
              opacity: 0.07,
              transform: [{ rotate: "35deg" }],
            }}
          />
          <View
            style={{
              position: "absolute",
              bottom: "30%",
              left: "6%",
              width: 80,
              height: 80,
              borderRadius: 40,
              borderWidth: 2.5,
              borderColor: c,
              opacity: 0.1,
            }}
          />
          <View
            style={{
              position: "absolute",
              bottom: "10%",
              right: "6%",
              width: 140,
              height: 140,
              borderRadius: 70,
              backgroundColor: c,
              opacity: 0.06,
            }}
          />
          <View
            style={{
              position: "absolute",
              bottom: "22%",
              left: "38%",
              width: 55,
              height: 55,
              borderRadius: 11,
              borderWidth: 2,
              borderColor: c,
              opacity: 0.1,
              transform: [{ rotate: "60deg" }],
            }}
          />
          <View
            style={{
              position: "absolute",
              top: "70%",
              left: "48%",
              width: 3,
              height: 90,
              borderRadius: 2,
              backgroundColor: c,
              opacity: 0.08,
              transform: [{ rotate: "-25deg" }],
            }}
          />
          <View
            style={{
              position: "absolute",
              bottom: "45%",
              right: "28%",
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: c,
              opacity: 0.1,
            }}
          />
        </>
      )}
    </Animated.View>
  );
}
