import { View } from "react-native";
import { ThemeColors } from "../../lib/theme";

export default function MixedBg({ colors }: { colors: ThemeColors }) {
  const c = colors.primary;
  return (
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
  );
}
