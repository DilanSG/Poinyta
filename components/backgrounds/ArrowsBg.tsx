import { View } from "react-native";
import Svg, { Polygon } from "react-native-svg";
import { ThemeColors } from "../../lib/theme";

export default function ArrowsBg({ colors }: { colors: ThemeColors }) {
  const c = colors.primary;

  type Arrow = {
    top: string;
    left?: string;
    right?: string;
    size: number;
    opacity: number;
    rotate: string;
  };

  const arrows: Arrow[] = [
    { top: "3%", left: "5%", size: 30, opacity: 0.08, rotate: "0deg" },
    { top: "6%", right: "10%", size: 24, opacity: 0.09, rotate: "90deg" },
    { top: "18%", left: "2%", size: 36, opacity: 0.07, rotate: "45deg" },
    { top: "14%", left: "30%", size: 20, opacity: 0.11, rotate: "-30deg" },
    { top: "22%", right: "5%", size: 28, opacity: 0.08, rotate: "135deg" },
    { top: "34%", left: "8%", size: 32, opacity: 0.07, rotate: "-60deg" },
    { top: "38%", left: "42%", size: 18, opacity: 0.12, rotate: "20deg" },
    { top: "30%", right: "12%", size: 26, opacity: 0.09, rotate: "270deg" },
    { top: "50%", left: "4%", size: 34, opacity: 0.07, rotate: "110deg" },
    { top: "54%", left: "28%", size: 22, opacity: 0.1, rotate: "-15deg" },
    { top: "48%", right: "8%", size: 30, opacity: 0.08, rotate: "80deg" },
    { top: "66%", left: "6%", size: 28, opacity: 0.08, rotate: "25deg" },
    { top: "70%", left: "35%", size: 20, opacity: 0.11, rotate: "-45deg" },
    { top: "62%", right: "14%", size: 36, opacity: 0.07, rotate: "330deg" },
    { top: "80%", left: "3%", size: 26, opacity: 0.09, rotate: "70deg" },
    { top: "84%", left: "25%", size: 32, opacity: 0.08, rotate: "-90deg" },
    { top: "76%", right: "6%", size: 24, opacity: 0.1, rotate: "180deg" },
    { top: "92%", left: "12%", size: 28, opacity: 0.09, rotate: "40deg" },
    { top: "88%", right: "12%", size: 22, opacity: 0.1, rotate: "-25deg" },
  ];

  const arrowPoints = (size: number): string => {
    const s = size;
    const tip = s * 0.55;
    return `${s},${s / 2} 0,0 0,${s * 0.3} ${s - tip},${s / 2} 0,${s * 0.7} 0,${s}`;
  };

  return (
    <>
      {arrows.map((ar, i) => (
        <View
          key={i}
          style={{
            position: "absolute",
            top: ar.top as any,
            left: ar.left as any,
            right: ar.right as any,
            width: ar.size,
            height: ar.size,
            opacity: ar.opacity,
            transform: [{ rotate: ar.rotate }],
          }}
        >
          <Svg width={ar.size} height={ar.size} viewBox={`0 0 ${ar.size} ${ar.size}`}>
            <Polygon points={arrowPoints(ar.size)} fill={c} />
          </Svg>
        </View>
      ))}
    </>
  );
}
