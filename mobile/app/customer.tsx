import { useCallback, useEffect, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { api } from "@/lib/api";
import { clearToken, loadToken } from "@/lib/auth";

type Delivery = {
  id: string;
  status: string;
  pickupAddress: string;
  dropoffAddress: string;
  offerAmount: number;
};

export default function CustomerScreen() {
  const [token, setToken] = useState<string | null>(null);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [error, setError] = useState("");

  const refresh = useCallback(async (auth: string) => {
    const data = await api<{ deliveries: Delivery[] }>("/api/deliveries", {
      token: auth,
    });
    setDeliveries(data.deliveries);
  }, []);

  useEffect(() => {
    void (async () => {
      const t = await loadToken();
      if (!t) {
        router.replace("/login");
        return;
      }
      setToken(t);
      try {
        await refresh(t);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load");
      }
    })();
  }, [refresh]);

  async function createDemo() {
    if (!token) return;
    setError("");
    try {
      await api("/api/deliveries", {
        method: "POST",
        token,
        body: JSON.stringify({
          pickupAddress: "2450 Mission St, San Francisco, CA",
          pickupLat: 37.7599,
          pickupLng: -122.4148,
          dropoffAddress: "88 Townsend St, San Francisco, CA",
          dropoffLat: 37.7816,
          dropoffLng: -122.3906,
          packageSize: "SMALL",
          packageNotes: "Created from Relay mobile",
        }),
      });
      await refresh(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create failed");
    }
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Your deliveries</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Pressable style={styles.btn} onPress={createDemo}>
        <Text style={styles.btnText}>Request demo hop</Text>
      </Pressable>
      <FlatList
        data={deliveries}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ gap: 10, paddingVertical: 12 }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              {item.pickupAddress.split(",")[0]} → {item.dropoffAddress.split(",")[0]}
            </Text>
            <Text style={styles.meta}>
              {item.status} · ${item.offerAmount.toFixed(2)}
            </Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.meta}>No deliveries yet</Text>}
      />
      <Pressable
        onPress={async () => {
          await clearToken();
          router.replace("/login");
        }}
      >
        <Text style={styles.link}>Sign out</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: 20 },
  title: { fontSize: 28, fontWeight: "800", letterSpacing: -0.5 },
  btn: {
    marginTop: 16,
    backgroundColor: "#c8f06c",
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: "center",
  },
  btnText: { fontWeight: "700" },
  card: {
    borderRadius: 16,
    padding: 14,
    backgroundColor: "rgba(255,255,255,0.75)",
    borderWidth: 1,
    borderColor: "rgba(18,23,18,0.1)",
  },
  cardTitle: { fontWeight: "700" },
  meta: { color: "#5c6b5f", marginTop: 4 },
  error: { color: "#8a2f2f", marginTop: 8 },
  link: { color: "#1f3d2a", fontWeight: "600", marginTop: 8 },
});
