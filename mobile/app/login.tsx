import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { router } from "expo-router";
import { login } from "@/lib/auth";

export default function LoginScreen() {
  const [email, setEmail] = useState("customer@relay.test");
  const [password, setPassword] = useState("password123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    setLoading(true);
    setError("");
    try {
      const data = await login(email.trim(), password);
      router.replace(data.user.role === "DRIVER" ? "/driver" : "/customer");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.brand}>Relay</Text>
      <Text style={styles.sub}>Sign in to request or deliver</Text>
      <TextInput
        style={styles.input}
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        placeholder="Email"
      />
      <TextInput
        style={styles.input}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        placeholder="Password"
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Pressable style={styles.btn} onPress={onSubmit} disabled={loading}>
        {loading ? <ActivityIndicator color="#121712" /> : <Text style={styles.btnText}>Sign in</Text>}
      </Pressable>
      <Text style={styles.hint}>Demo: customer@relay.test / driver@relay.test</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: 24, justifyContent: "center", gap: 12 },
  brand: { fontSize: 40, fontWeight: "800", letterSpacing: -1 },
  sub: { color: "#5c6b5f", marginBottom: 12 },
  input: {
    borderWidth: 1,
    borderColor: "rgba(18,23,18,0.12)",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "rgba(255,255,255,0.8)",
  },
  btn: {
    backgroundColor: "#c8f06c",
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  btnText: { fontWeight: "700", color: "#121712" },
  error: { color: "#8a2f2f" },
  hint: { color: "#5c6b5f", marginTop: 8, fontSize: 12 },
});
