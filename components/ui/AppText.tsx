import React from "react";
import { Text, TextProps } from "react-native";

type Props = TextProps & {
  disableHorizontalPadding?: boolean;
};

const SAFE_TEXT_PADDING_RIGHT = 2;

// Componente base de texto de la app. Toma propiedades base del Text nativo con ajustes visuales extras.
// Retorna texto con compensacion minima para evitar recorte del ultimo glifo.
export default function AppText({ style, disableHorizontalPadding, numberOfLines, ...props }: Props) {
  const shouldCompensate = !disableHorizontalPadding && numberOfLines === undefined;
  const compensationStyle = shouldCompensate ? { paddingRight: SAFE_TEXT_PADDING_RIGHT } : undefined;

  return <Text {...props} numberOfLines={numberOfLines} style={[style, compensationStyle]} />;
}
