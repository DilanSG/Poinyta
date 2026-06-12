import { useState, useCallback } from "react";
import { useFocusEffect } from "expo-router";
import { WishItem } from "../lib/storage/types";
import {
  getWishlist,
  addWishItem as storageAddWishItem,
  updateWishItem as storageUpdateWishItem,
  deleteWishItem as storageDeleteWishItem,
} from "../lib/storage";

// Hook personalizado para manejar el estado y operaciones CRUD de la lista de deseos.
// Recarga al recibir foco via useFocusEffect.
export function useWishlist() {
  const [items, setItems] = useState<WishItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Recarga la wishlist desde storage. Los errores se tragan para
  // mantener la UI estable si la DB responde lento.
  const fetchWishlist = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getWishlist();
      setItems(data);
    } catch (err: unknown) {
      console.error("useWishlist: error fetching wishlist", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchWishlist();
    }, [fetchWishlist])
  );

  // Inserta item deseado en storage y refresca lista en UI.
  const addWishItem = useCallback(async (item: Omit<WishItem, "id" | "createdAt">) => {
    await storageAddWishItem(item);
    await fetchWishlist();
  }, [fetchWishlist]);

  // Actualiza item existente por ID y refresca lista en UI.
  const updateWishItem = useCallback(async (id: string, item: Omit<WishItem, "id" | "createdAt">) => {
    await storageUpdateWishItem(id, item);
    await fetchWishlist();
  }, [fetchWishlist]);

  // Elimina item por ID y refresca lista en UI.
  const deleteWishItem = useCallback(async (id: string) => {
    await storageDeleteWishItem(id);
    await fetchWishlist();
  }, [fetchWishlist]);

  return {
    items,
    loading,
    addWishItem,
    updateWishItem,
    deleteWishItem,
    reload: fetchWishlist,
  };
}
