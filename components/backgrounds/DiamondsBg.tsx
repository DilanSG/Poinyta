import { View } from "react-native";
import Svg, { Polygon } from "react-native-svg";
import { ThemeColors } from "../../lib/theme";

export default function DiamondsBg({ colors }: { colors: ThemeColors }) {
  const c = colors.primary;

  // 10 diamantes (5 relleno sólido + 5 solo borde)
  const diamonds = [
    // Relleno uniforme
    { top: "3%", left: "2%", width: 80, height: 100, type: "filled", rotate: "0deg", opacity: 0.09 },
    { top: "12%", right: "8%", width: 60, height: 75, type: "filled", rotate: "15deg", opacity: 0.08 },
    { bottom: "25%", left: "6%", width: 70, height: 88, type: "filled", rotate: "25deg", opacity: 0.08 },
    { bottom: "10%", right: "12%", width: 90, height: 112, type: "filled", rotate: "5deg", opacity: 0.09 },
    { bottom: "45%", right: "30%", width: 45, height: 56, type: "filled", rotate: "35deg", opacity: 0.09 },

    // Solo borde
    { top: "7%", left: "70%", width: 75, height: 94, type: "stroke", rotate: "8deg", opacity: 0.08, strokeWidth: 2.5 },
    { top: "35%", right: "20%", width: 55, height: 68, type: "stroke", rotate: "-25deg", opacity: 0.07, strokeWidth: 2 },
    { bottom: "55%", left: "18%", width: 65, height: 81, type: "stroke", rotate: "15deg", opacity: 0.08, strokeWidth: 2 },
    { bottom: "22%", right: "45%", width: 70, height: 88, type: "stroke", rotate: "-5deg", opacity: 0.07, strokeWidth: 2.5 },
    { top: "48%", left: "15%", width: 50, height: 62, type: "stroke", rotate: "30deg", opacity: 0.08, strokeWidth: 2 },
  ];

  // Forma de diamante joya (corona truncada + pabellón)
  const getJewelPoints = (w: number, h: number): string => {
    const topLeftX = w * 0.2;
    const topRightX = w * 0.8;
    const girdleY = h * 0.4;
    const tipX = w / 2;
    const tipY = h;
    return `${topLeftX},0 ${topRightX},0 ${w},${girdleY} ${tipX},${tipY} ${0},${girdleY}`;
  };

  return (
    <View
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: "hidden",
      }}
    >
      {diamonds.map((d, idx) => {
        const { width: w, height: h, type, rotate, opacity } = d;
        const points = getJewelPoints(w, h);

        const positionStyle: any = { position: "absolute" };
        if (d.top !== undefined) positionStyle.top = d.top;
        if (d.bottom !== undefined) positionStyle.bottom = d.bottom;
        if (d.left !== undefined) positionStyle.left = d.left;
        if (d.right !== undefined) positionStyle.right = d.right;
        positionStyle.transform = [{ rotate }];

        return (
          <Svg
            key={idx}
            style={positionStyle}
            width={w}
            height={h}
            viewBox={`0 0 ${w} ${h}`}
          >
            <Polygon
              points={points}
              fill={type === "filled" ? c : "transparent"}
              stroke={type === "stroke" ? c : "none"}
              strokeWidth={type === "stroke" ? d.strokeWidth || 2 : 0}
              strokeLinejoin="round"
              opacity={opacity}
            />
          </Svg>
        );
      })}
    </View>
  );
}