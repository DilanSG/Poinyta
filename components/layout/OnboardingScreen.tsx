import { useRef, useState } from "react";
import {
  StyleSheet,
  View,
  TextInput,
  TouchableOpacity,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Image,
  ScrollView,
} from "react-native";
import Svg, { Circle, Defs, RadialGradient, Stop, Rect } from "react-native-svg";
import { Ionicons } from "@expo/vector-icons";
import { useTheme, ThemeColors } from "../../lib/theme";
import { useAlert } from "../ui/AlertModal";
import { setUserName } from "../../lib/storage";
import AppText from "../ui/AppText";

type Props = {
  onComplete: (userName: string) => void;
};

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

type Side = "left" | "right";
type Tone = "primary" | "accent";

const FEATURES: Array<{
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  desc: string;
  side: Side;
  tone: Tone;
  inset: number;
  topGap: number;
}> = [
  {
    icon: "wallet-outline",
    label: "Finanzas",
    desc: "Controla tus ingresos y gastos",
    side: "left",
    tone: "primary",
    inset: 0,
    topGap: 0,
  },
  {
    icon: "checkbox-outline",
    label: "Tareas",
    desc: "Organiza tus pendientes diarios",
    side: "right",
    tone: "accent",
    inset: 28,
    topGap: 36,
  },
  {
    icon: "document-text-outline",
    label: "Notas",
    desc: "Captura ideas al instante",
    side: "left",
    tone: "primary",
    inset: 40,
    topGap: 30,
  },
  {
    icon: "flag-outline",
    label: "Metas",
    desc: "Define y alcanza tus objetivos",
    side: "right",
    tone: "accent",
    inset: 8,
    topGap: 40,
  },
  {
    icon: "heart-outline",
    label: "Deseos",
    desc: "Guarda lo que quieres lograr",
    side: "left",
    tone: "primary",
    inset: 18,
    topGap: 32,
  },
];

// Pantalla de bienvenida / Onboarding para el primer uso.
// Presenta la marca, una lista alterna izquierda/derecha de funcionalidades
// y solicita el nombre del usuario en la parte inferior.
export default function OnboardingScreen({ onComplete }: Props) {
  const colors = useTheme();
  const styles = getStyles(colors);
  const { showAlert } = useAlert();

  const scrollRef = useRef<ScrollView>(null);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const trimmed = name.trim();
  const canContinue = trimmed.length > 0 && !saving;

  const handleStart = async () => {
    if (!canContinue) {
      return;
    }
    setSaving(true);
    try {
      await setUserName(trimmed);
      onComplete(trimmed);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "No se pudo guardar el nombre.";
      showAlert("Error", msg);
      setSaving(false);
    }
  };

  const handleInputFocus = () => {
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 120);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
      keyboardVerticalOffset={0}
    >
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Svg width={SCREEN_W} height={SCREEN_H}>
          <Defs>
            <RadialGradient id="onbGlow" cx="50%" cy="20%" r="65%">
              <Stop offset="0%" stopColor={colors.primary} stopOpacity="0.12" />
              <Stop offset="70%" stopColor={colors.primary} stopOpacity="0.02" />
              <Stop offset="100%" stopColor={colors.primary} stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Rect x="0" y="0" width={SCREEN_W} height={SCREEN_H} fill="url(#onbGlow)" />
          <Circle cx={SCREEN_W * 0.12} cy={SCREEN_H * 0.08} r={60} fill={colors.primary} opacity={0.06} />
          <Circle cx={SCREEN_W * 0.92} cy={SCREEN_H * 0.16} r={40} fill={colors.accentBlue} opacity={0.08} />
          <Circle cx={SCREEN_W * 0.95} cy={SCREEN_H * 0.78} r={80} fill={colors.primary} opacity={0.05} />
          <Circle cx={SCREEN_W * 0.08} cy={SCREEN_H * 0.92} r={70} fill={colors.accentBlue} opacity={0.06} />
        </Svg>
      </View>

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        bounces={false}
      >
        <View style={styles.brandWrap}>
          <View style={styles.iconHalo} />
          <Image
            source={require("../../assets/icon.png")}
            style={styles.brandIcon}
            resizeMode="contain"
          />
        </View>

        <AppText style={styles.brandName} disableHorizontalPadding>
          Poinyta
        </AppText>
        <AppText style={styles.tagline}>
          Tu espacio personal para organizar todo
        </AppText>

        <View style={styles.featuresList}>
          {FEATURES.map((f) => {
            const color = f.tone === "primary" ? colors.primary : colors.accentBlue;
            const isRight = f.side === "right";
            const offsetStyle = isRight
              ? { marginRight: f.inset, marginTop: f.topGap }
              : { marginLeft: f.inset, marginTop: f.topGap };
            const iconBlock = (
              <View style={styles.iconStack}>
                <View
                  style={[
                    styles.iconHaloOuter,
                    { backgroundColor: color + "10" },
                  ]}
                />
                <View
                  style={[
                    styles.iconHaloMid,
                    { backgroundColor: color + "22" },
                  ]}
                />
                <View
                  style={[
                    styles.iconCore,
                    {
                      backgroundColor: color + "30",
                      borderColor: color + "55",
                      shadowColor: color,
                    },
                  ]}
                >
                  <Ionicons name={f.icon} size={22} color={color} />
                </View>
              </View>
            );
            const labelGlow = {
              textShadowColor: color + "70",
              textShadowOffset: { width: 0, height: 0 },
              textShadowRadius: 10,
            };
            const descGlow = {
              textShadowColor: color + "40",
              textShadowOffset: { width: 0, height: 0 },
              textShadowRadius: 6,
            };
            return (
              <View
                key={f.label}
                style={[
                  styles.featureRow,
                  isRight && styles.featureRowRight,
                  offsetStyle,
                ]}
              >
                {!isRight && iconBlock}
                <View
                  style={[
                    styles.featureText,
                    isRight && styles.featureTextRight,
                  ]}
                >
                  <AppText
                    style={[styles.featureLabel, labelGlow]}
                    disableHorizontalPadding
                  >
                    {f.label}
                  </AppText>
                  <AppText
                    style={[styles.featureDesc, descGlow]}
                    disableHorizontalPadding
                  >
                    {f.desc}
                  </AppText>
                </View>
                {isRight && iconBlock}
              </View>
            );
          })}
        </View>

        <View style={styles.spacer} />

        <View style={styles.inputBlock}>
          <AppText style={styles.inputLabel}>¿Cómo te llamas?</AppText>
          <View style={styles.inputWrap}>
            <Ionicons
              name="person-outline"
              size={18}
              color={colors.textSecondary}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.textInput}
              placeholder="Tu nombre"
              placeholderTextColor={colors.textSecondary}
              value={name}
              onChangeText={setName}
              maxLength={20}
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={handleStart}
              onFocus={handleInputFocus}
            />
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.startBtn, !canContinue && styles.startBtnDisabled]}
          onPress={handleStart}
          disabled={!canContinue}
          activeOpacity={0.85}
        >
          <AppText style={styles.startText}>
            {saving ? "Guardando..." : "Empezar"}
          </AppText>
          {!saving && <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const BRAND_ICON_SIZE = 76;

const getStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scroll: {
      flexGrow: 1,
      paddingHorizontal: 24,
      paddingTop: Math.round(SCREEN_H * 0.1) + 16,
      paddingBottom: 16,
      alignItems: "stretch",
    },
    brandWrap: {
      width: BRAND_ICON_SIZE,
      height: BRAND_ICON_SIZE,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 10,
      alignSelf: "center",
    },
    iconHalo: {
      position: "absolute",
      width: BRAND_ICON_SIZE * 1.35,
      height: BRAND_ICON_SIZE * 1.35,
      borderRadius: (BRAND_ICON_SIZE * 1.35) / 2,
      backgroundColor: colors.primary,
      opacity: 0.08,
    },
    brandIcon: {
      width: BRAND_ICON_SIZE,
      height: BRAND_ICON_SIZE,
    },
    brandName: {
      width: "100%",
      fontSize: 28,
      fontWeight: "bold",
      color: colors.textPrimary,
      textAlign: "center",
      paddingHorizontal: 12,
    },
    tagline: {
      width: "100%",
      fontSize: 13,
      color: colors.textSecondary,
      textAlign: "center",
      marginTop: 4,
      marginBottom: 28,
      paddingHorizontal: 12,
    },

    /* Lista alternada de features */
    featuresList: {
      width: "100%",
    },
    featureRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
    },
    featureRowRight: {
      justifyContent: "flex-end",
      alignSelf: "flex-end",
    },
    iconStack: {
      width: 60,
      height: 60,
      alignItems: "center",
      justifyContent: "center",
    },
    iconHaloOuter: {
      position: "absolute",
      width: 60,
      height: 60,
      borderRadius: 30,
    },
    iconHaloMid: {
      position: "absolute",
      width: 48,
      height: 48,
      borderRadius: 24,
    },
    iconCore: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.55,
      shadowRadius: 8,
      elevation: 6,
    },
    featureText: {
      flexShrink: 0,
    },
    featureTextRight: {
      alignItems: "flex-end",
    },
    featureLabel: {
      fontSize: 17,
      fontWeight: "800",
      color: colors.textPrimary,
      letterSpacing: 0.2,
    },
    featureDesc: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 2,
    },

    spacer: {
      flex: 1,
      minHeight: 24,
    },

    /* Input */
    inputBlock: {
      width: "100%",
    },
    inputLabel: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.textPrimary,
      marginBottom: 10,
      textAlign: "center",
    },
    inputWrap: {
      width: "100%",
      flexDirection: "row",
      alignItems: "center",
      height: 54,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      paddingHorizontal: 14,
    },
    inputIcon: {
      marginRight: 10,
    },
    textInput: {
      flex: 1,
      color: colors.textPrimary,
      fontSize: 16,
      height: "100%",
    },

    /* Footer button */
    footer: {
      paddingHorizontal: 24,
      paddingBottom: 28,
      paddingTop: 12,
    },
    startBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      backgroundColor: colors.primary,
      paddingVertical: 15,
      borderRadius: 14,
    },
    startBtnDisabled: {
      opacity: 0.45,
    },
    startText: {
      color: "#FFFFFF",
      fontWeight: "bold",
      fontSize: 16,
      letterSpacing: 0.3,
    },
  });
export { OnboardingScreen };
