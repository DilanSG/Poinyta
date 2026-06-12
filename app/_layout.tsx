import { Tabs, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { TouchableOpacity, View } from "react-native";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import * as Notifications from "expo-notifications";
import { ThemeProvider, useTheme, useThemeMode } from "../lib/theme";
import { getUserName, getTasks } from "../lib/storage";
import { initDatabase } from "../lib/storage/db";
import OnboardingScreen from "../components/layout/OnboardingScreen";
import DrawerMenu from "../components/layout/DrawerMenu";
import AnimatedSplash from "../components/layout/AnimatedSplash";
import { NotificationProvider } from "../components/layout/NotificationContext";
import NotificationBanner from "../components/layout/NotificationBanner";
import { AlertProvider } from "../components/ui/AlertModal";
import { configureNotificationHandler, rescheduleAllReminders } from "../lib/notifications/taskReminders";

const DrawerContext = createContext<{ open: () => void }>({ open: () => {} });

// Boton de menu del header principal. Abre el drawer global usando el contexto compartido.
function MenuButton() {
  const colors = useTheme();
  const { open } = useContext(DrawerContext);
  return (
    <TouchableOpacity
      onPress={open}
      style={{ paddingLeft: 16, paddingRight: 8, paddingVertical: 4 }}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <Ionicons name="menu" size={24} color={colors.textPrimary} />
    </TouchableOpacity>
  );
}

// Punto de entrada de la app. Envuelve la navegacion en el ThemeProvider para exponer colores y modo de tema.
export default function RootLayout() {
  return (
    <ThemeProvider>
      <NotificationProvider>
        <AlertProvider>
          <RootContent />
        </AlertProvider>
      </NotificationProvider>
    </ThemeProvider>
  );
}

// Gestiona el flujo inicial: onboarding, splash y tabs autenticadas.
function RootContent() {
  const colors = useTheme();
  const { isDark } = useThemeMode();
  const [userName, setUserName] = useState<string | null | undefined>(undefined);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const [splashVisible, setSplashVisible] = useState(true);
  const [splashMounted, setSplashMounted] = useState(true);
  const splashStartRef = useRef(Date.now());
  const notificationResponseRef = useRef(false);

  useEffect(() => {
    configureNotificationHandler();

    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      if (data?.screen === "tasks") {
        // Navegar a tareas al tocar la notificacion.
        // setTimeout para que el navigation container termine de montarse.
        setTimeout(() => {
          router.push("/tasks");
        }, 500);
      }
    });

    return () => sub.remove();
  }, []);

  useEffect(() => {
    initDatabase()
      .then(() => getUserName())
      .then((name) => {
        setUserName(name ?? null);
        setReady(true);
      });
  }, []);

  // Reagendar recordatorios al arrancar
  useEffect(() => {
    if (!ready || notificationResponseRef.current) return;
    notificationResponseRef.current = true;
    getTasks().then((tasks) => rescheduleAllReminders(tasks)).catch((err: unknown) => console.error("rescheduleAllReminders failed", err));
  }, [ready]);

  // Garantiza que el splash se vea al menos 1500ms para evitar un parpadeo
  // cuando la DB se inicializa muy rapido (ej. en caliente con HMR).
  // `ready` se activa cuando initDatabase + getUserName terminan.
  useEffect(() => {
    if (!ready) {
      return;
    }

    const minDurationMs = 1500;
    const elapsed = Date.now() - splashStartRef.current;
    const remaining = Math.max(0, minDurationMs - elapsed);
    const timer = setTimeout(() => setSplashVisible(false), remaining);

    return () => clearTimeout(timer);
  }, [ready]);

  const openDrawer = useCallback(() => setDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  const statusBarStyle = isDark ? "light" : "dark";

  let content: ReactNode;

  if (userName === undefined) {
    content = <View style={{ flex: 1, backgroundColor: colors.background }} />;
  } else if (userName === null) {
    content = <OnboardingScreen onComplete={(name) => setUserName(name)} />;
  } else {
    content = (
      <>
        <Tabs
          screenOptions={{
            tabBarStyle: { display: "none" },
            headerStyle: {
              backgroundColor: colors.surface,
            },
            headerShadowVisible: false,
            headerTintColor: colors.textPrimary,
            headerTitleStyle: {
              fontWeight: "600",
              fontSize: 17,
            },
            headerLeft: () => <MenuButton />,
          }}
        >
          <Tabs.Screen name="index" options={{ title: "Inicio" }} />
          <Tabs.Screen name="finance" options={{ title: "Balances" }} />
          <Tabs.Screen name="tasks" options={{ title: "Tareas" }} />
          <Tabs.Screen name="notes" options={{ title: "Notas" }} />
          <Tabs.Screen name="wishlist" options={{ title: "Deseos" }} />
          <Tabs.Screen name="goals" options={{ title: "Metas Secuenciales" }} />
          <Tabs.Screen name="settings" options={{ title: "Ajustes" }} />
        </Tabs>
        <DrawerMenu
          visible={drawerOpen}
          onClose={closeDrawer}
        />
      </>
    );
  }

  return (
    <DrawerContext.Provider value={{ open: openDrawer }}>
      <StatusBar style={statusBarStyle} />
      {content}
      <NotificationBanner />
      {splashMounted ? (
        <AnimatedSplash
          onHidden={() => setSplashMounted(false)}
        />
      ) : null}
    </DrawerContext.Provider>
  );
}

