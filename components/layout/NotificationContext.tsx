import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { AppNotification, NotificationType } from "../../lib/storage/types";
import { getNotifications, addNotification as dbAddNotification, markNotificationAsRead, clearReadNotifications } from "../../lib/storage";

type NotificationContextType = {
  notifications: AppNotification[];
  banner: AppNotification | null;
  triggerNotification: (message: string, type?: NotificationType) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  clearRead: () => Promise<void>;
  hideBanner: () => void;
};

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

type NotificationProviderProps = {
  children: ReactNode;
};

// Proveedor de contexto para manejar notificaciones locales in-app y alertas tipo banner flotante. Recibe nodos hijos.
export function NotificationProvider({ children }: NotificationProviderProps) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [banner, setBanner] = useState<AppNotification | null>(null);

  const loadAll = useCallback(async () => {
    try {
      const data = await getNotifications();
      setNotifications(data);
    } catch {
      // Manejar error en silencio o reportarlo
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const triggerNotification = async (message: string, type: NotificationType = "info") => {
    try {
      await dbAddNotification(message, type);
      await loadAll();
      
      // Mostrar banner persistente flotante temporal
      const newNotification: AppNotification = {
        id: Math.random().toString(), // ID temporal para el banner en pantalla virtual
        message,
        type,
        read: false,
        createdAt: new Date().toISOString()
      };
      
      setBanner(newNotification);
    } catch {
      // Silencio
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await markNotificationAsRead(id);
      await loadAll();
    } catch {
      // Silencio
    }
  };

  const clearRead = async () => {
    try {
      await clearReadNotifications();
      await loadAll();
    } catch {
      // Silencio
    }
  };

  const hideBanner = () => {
    setBanner(null);
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        banner,
        triggerNotification,
        markAsRead,
        clearRead,
        hideBanner
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

// Hook reactivo para acceder a las notificaciones globales de la app.
export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications debe usarse dentro de un NotificationProvider");
  }
  return context;
}
