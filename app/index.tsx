import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { useTheme, useGlow, ThemeColors } from "../lib/theme";
import { useHomeData } from "../hooks/useHomeData";
import { useWeather } from "../hooks/useWeather";
import FinancePeriodCard from "../components/features/finance/FinancePeriodCard";
import BackgroundDecor from "../components/ui/BackgroundDecor";
import AppText from "../components/ui/AppText";
import GlowView from "../components/ui/GlowView";

// Pantalla principal (Dashboard). Muestra clima, finanzas, tareas pendientes y notas recientes.
export default function HomeScreen() {
  const colors = useTheme();
  const { glowStyle } = useGlow();
  const styles = getStyles(colors);
  const router = useRouter();

  const { userName, tasks, notes, weekStats, monthStats, yearStats, weekBreakdown, monthBreakdown, yearBreakdown, loading } = useHomeData();
  const { weather } = useWeather();
  const [weatherModalVisible, setWeatherModalVisible] = useState(false);

  const getGreeting = () => {
    const hr = new Date().getHours();
    if (hr < 12) return "Buenos días";
    if (hr < 18) return "Buenas tardes";
    return "Buenas noches";
  };

  return (
    <View style={styles.wrapper}>
      <BackgroundDecor colors={colors} screenVariant={0} />
    <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollInner}>

      {loading ? (
        <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
      <React.Fragment>
        {/* Cabecera: saludo + clima */}
        <View style={styles.header}>
        <View style={styles.headerLeft}>
          <AppText style={styles.greeting}>{getGreeting()}</AppText>
          <AppText style={styles.userName} numberOfLines={1}>{userName || "Usuario"}</AppText>
        </View>
        {weather && (
          <TouchableOpacity onPress={() => setWeatherModalVisible(true)} activeOpacity={0.7} style={[styles.weatherChip, glowStyle]}>
            <Ionicons
              name={weather.iconName as keyof typeof Ionicons.glyphMap}
              size={22}
              color={colors.primary}
            />
            <View style={styles.weatherInfo}>
              <AppText style={styles.weatherTemp} numberOfLines={1}>
                {weather.temperature}°  {weather.condition}
              </AppText>
              {weather.cityName ? (
                <AppText style={styles.weatherCity} numberOfLines={1}>{weather.cityName}</AppText>
              ) : null}
            </View>
          </TouchableOpacity>
        )}
      </View>

      {/* Sección de finanzas con deslizamiento por periodo */}
      <View style={styles.sectionHeader}>
        <AppText style={styles.sectionTitle}>Finanzas</AppText>
        <TouchableOpacity onPress={() => router.push("/finance")}>
          <AppText style={styles.seeAll}>Ver detalle</AppText>
        </TouchableOpacity>
      </View>

      <FinancePeriodCard
        weekStats={weekStats}
        monthStats={monthStats}
        yearStats={yearStats}
        weekBreakdown={weekBreakdown}
        monthBreakdown={monthBreakdown}
        yearBreakdown={yearBreakdown}
      />

      {/* Tareas Pendientes */}
      <View style={styles.sectionHeader}>
        <AppText style={styles.sectionTitle}>Tareas Pendientes</AppText>
        <TouchableOpacity onPress={() => router.push("/tasks")}>
          <AppText style={styles.seeAll}>Ver todas</AppText>
        </TouchableOpacity>
      </View>

      {tasks.length === 0 ? (
        <GlowView style={styles.emptyCard} cardRadius={12}>
          <AppText style={styles.emptyText}>Sin tareas pendientes</AppText>
        </GlowView>
      ) : (
        <GlowView style={styles.list} cardRadius={12}>
          {tasks.map((task, index) => (
            <TouchableOpacity
              key={task.id}
              style={[styles.listItem, index === tasks.length - 1 && styles.listItemLast]}
              onPress={() => router.push("/tasks")}
            >
              <Ionicons name="square-outline" size={18} color={colors.primary} />
              <AppText style={styles.listText} numberOfLines={1}>{task.title}</AppText>
              <Ionicons name="chevron-forward" size={14} color={colors.textSecondary} />
            </TouchableOpacity>
          ))}
        </GlowView>
      )}

      {/* Notas Recientes */}
      <View style={[styles.sectionHeader, { marginTop: 20 }]}>
        <AppText style={styles.sectionTitle}>Notas Recientes</AppText>
        <TouchableOpacity onPress={() => router.push("/notes")}>
          <AppText style={styles.seeAll}>Ver todas</AppText>
        </TouchableOpacity>
      </View>

      {notes.length === 0 ? (
        <GlowView style={styles.emptyCard} cardRadius={12}>
          <AppText style={styles.emptyText}>Sin notas recientes</AppText>
        </GlowView>
      ) : (
        <View style={styles.notesGrid}>
          {notes.map((note) => (
            <TouchableOpacity
              key={note.id}
              style={[styles.noteCard, glowStyle]}
              onPress={() => router.push("/notes")}
              activeOpacity={0.75}
            >
              <AppText style={styles.noteText} numberOfLines={4}>{note.title ?? note.content}</AppText>
              <AppText style={styles.noteDate}>
                {new Date(note.createdAt).toLocaleDateString("es", {
                  day: "numeric",
                  month: "short",
                })}
              </AppText>
            </TouchableOpacity>
          ))}
        </View>
      )}

      </React.Fragment>
      )}

    </ScrollView>

      {/* Modal de clima detallado */}
      <Modal visible={weatherModalVisible} transparent animationType="fade" onRequestClose={() => setWeatherModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <GlowView style={styles.weatherModalCard} cardRadius={12}>
            <View style={styles.weatherModalHeader}>
              <AppText style={styles.weatherModalTitle}>Clima</AppText>
              <TouchableOpacity onPress={() => setWeatherModalVisible(false)}>
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {weather && (
              <>
                {/* Ciudad + país */}
                <View style={styles.weatherModalRow}>
                  <Ionicons name="location-outline" size={16} color={colors.textSecondary} />
                  <AppText style={styles.weatherModalLabel}>
                    {weather.cityName}{weather.country ? `, ${weather.country}` : ""}
                  </AppText>
                </View>

                {/* Temperatura real y sensación */}
                <View style={styles.weatherModalRow}>
                  <Ionicons name="thermometer-outline" size={16} color={colors.textSecondary} />
                  <AppText style={styles.weatherModalLabel}>
                    {weather.temperature}° (sensación {weather.apparentTemp}°)
                  </AppText>
                </View>

                {/* Condición */}
                <View style={styles.weatherModalRow}>
                  <Ionicons name={weather.iconName as keyof typeof Ionicons.glyphMap} size={16} color={colors.textSecondary} />
                  <AppText style={styles.weatherModalLabel}>{weather.condition}</AppText>
                </View>

                {/* Humedad */}
                <View style={styles.weatherModalRow}>
                  <Ionicons name="water-outline" size={16} color={colors.textSecondary} />
                  <AppText style={styles.weatherModalLabel}>Humedad: {weather.humidity}%</AppText>
                </View>

                {/* Viento */}
                <View style={styles.weatherModalRow}>
                  <Ionicons name="speedometer-outline" size={16} color={colors.textSecondary} />
                  <AppText style={styles.weatherModalLabel}>Viento: {weather.windSpeed} km/h</AppText>
                </View>
              </>
            )}

            <TouchableOpacity style={styles.weatherModalBtn} onPress={() => setWeatherModalVisible(false)}>
              <AppText style={styles.weatherModalBtnText}>Cerrar</AppText>
            </TouchableOpacity>
          </GlowView>
        </View>
      </Modal>
    </View>
  );
}

function getStyles(colors: ThemeColors) {
  return StyleSheet.create({
    wrapper: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scroll: {
      flex: 1,
    },
    scrollInner: {
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 48,
    },

    /* Cabecera */
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 24,
    },
    headerLeft: {
      flex: 1,
      marginRight: 12,
      minWidth: 0,
    },
    greeting: {
      fontSize: 14,
      color: colors.textSecondary,
      fontWeight: "500",
    },
    userName: {
      fontSize: 26,
      fontWeight: "bold",
      color: colors.textPrimary,
      marginTop: 2,
    },

    /* Chip de clima */
    weatherChip: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderWidth: 1,
      borderRadius: 12,
      paddingHorizontal: 10,
      paddingVertical: 8,
      gap: 8,
      flexShrink: 1,
      maxWidth: "60%",
    },
    weatherInfo: {
      flexShrink: 1,
      minWidth: 0,
    },
    weatherTemp: {
      fontSize: 13,
      fontWeight: "700",
      color: colors.textPrimary,
      flexShrink: 1,
    },
    weatherCity: {
      fontSize: 11,
      color: colors.textSecondary,
      marginTop: 1,
    },

    /* Sección headers */
    sectionHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 10,
    },
    sectionTitle: {
      fontSize: 15,
      fontWeight: "700",
      color: colors.textPrimary,
    },
    seeAll: {
      fontSize: 13,
      fontWeight: "500",
      color: colors.primary,
    },

    /* Empty state */
    emptyCard: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderWidth: 1,
      borderRadius: 12,
      padding: 16,
      alignItems: "center",
    },
    emptyText: {
      fontSize: 14,
      color: colors.textSecondary,
    },

    /* Lista de tareas */
    list: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderWidth: 1,
      borderRadius: 12,
      overflow: "hidden",
    },
    listItem: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 14,
      paddingVertical: 13,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      gap: 12,
    },
    listItemLast: {
      borderBottomWidth: 0,
    },
    listText: {
      fontSize: 14,
      color: colors.textPrimary,
      flex: 1,
    },

    /* Grid de notas */
    notesGrid: {
      flexDirection: "row",
      gap: 12,
    },
    noteCard: {
      flex: 1,
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderWidth: 1,
      borderRadius: 12,
      padding: 14,
      justifyContent: "space-between",
      minHeight: 100,
    },
    noteText: {
      fontSize: 13,
      color: colors.textPrimary,
      lineHeight: 19,
      flex: 1,
    },
    noteDate: {
      fontSize: 11,
      color: colors.textSecondary,
      marginTop: 6,
    },

    /* Modal clima */
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.55)",
      alignItems: "center",
      justifyContent: "center",
      padding: 32,
    },
    weatherModalCard: {
      width: "100%",
      maxWidth: 340,
      backgroundColor: colors.surface,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 24,
      gap: 14,
    },
    weatherModalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    weatherModalTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: colors.textPrimary,
    },
    weatherModalRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    weatherModalLabel: {
      fontSize: 15,
      color: colors.textPrimary,
      flex: 1,
    },
    weatherModalBtn: {
      backgroundColor: colors.primary,
      borderRadius: 10,
      paddingVertical: 11,
      alignItems: "center",
      marginTop: 4,
    },
    weatherModalBtnText: {
      fontSize: 14,
      fontWeight: "600",
      color: "#FAF8F5",
    },
  });
}
