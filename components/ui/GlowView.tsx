import React from "react";
import { View } from "react-native";
import type { ViewProps } from "react-native";
import { useGlow } from "../../lib/theme";

type Props = ViewProps & {
  cardRadius?: number;
};

export default function GlowView({ children, style, cardRadius = 12, ...props }: Props) {
  const { glowStyle } = useGlow();

  return (
    <View style={[style, glowStyle]} {...props}>
      {children}
    </View>
  );
}
