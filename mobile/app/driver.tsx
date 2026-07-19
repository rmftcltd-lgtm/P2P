import { useCallback, useEffect, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import * as Location from "expo-location";
import { router } from "expo-router";
import { api } from "@/lib/api";
import { clearToken, loadToken } from "@/lib/auth";

type Job = {
  id: string;
  pickupAddress: string;
  dropoffAddress: string;
  offerAmount: number;
  distanceFromDriverKm: number;
  status: string;
};

export default function DriverScreen() {
  const [token, setToken] = useState<string | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const refresh = useCallback(async (auth: string) => {
    const data = await api<{ jobs: Job[] }>("/api/drivers/jobs", { token: auth });
    setJobs(data.jobs);
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

  async function goOnlineWithGps() {
    if (!token) return;
    setError("");
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      setError("Location permission denied");
      return;
    }
    const pos = await Location.getCurrentPositionAsync({});
    await api("/api/drivers/location", {
      method: "POST",
      token,
      body: JSON.stringify({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        isOnline: true,
      }),
    });
    await api("/api/drivers/location", {
      method: "PATCH",
      token,
      body: JSON.stringify({ isOnline: true }),
    });
    setMessage("Online with device GPS");
    await refresh(token);
  }

  async function accept(id: string) {
    if (!token) return;
    try {
      await api(`/api/deliveries/${id}/accept`, { method: "POST", token });
      setMessage("Job accepted");
      await refresh(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Accept failed");
    }
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Driver radio</Text>
      <Pressable style={styles.btn} onPress={goOnlineWithGps}>
        <Text style={styles.btnText}>Go online + GPS</Text>
      </Pressable>
      {message ? <Text style={styles.ok}>{message}</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <FlatList
        data={jobs}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ gap: 10, paddingVertical: 12 }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              {item.pickupAddress.split(",")[0]} → {item.dropoffAddress.split(",")[0]}
            </Text>
            <Text style={styles.meta}>
              ${item.offerAmount.toFixed(2)} · {item.distanceFromDriverKm.toFixed(1)} km away
            </Text>
            <Pressable style={styles.smallBtn} onPress={() => accept(item.id)}>
              <Text style={styles.btnText}>Accept</Text>
            </Pressable>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.meta}>No nearby jobs</Text>}
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
    backgroundColor: "#1f3d2a",
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: "center",
  },
  smallBtn: {
    marginTop: 10,
    alignSelf: "flex-start",
    backgroundColor: "#c8f06c",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  btnText: { fontWeight: "700", color: "#121712" },
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
  ok: { color: "#1f3d2a", marginTop: 8, fontWeight: "600" },
  link: { color: "#1f3d2a", fontWeight: "600", marginTop: 8 },
});
