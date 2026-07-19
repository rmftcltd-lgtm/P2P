import * as SecureStore from "expo-secure-store";
import { api } from "./api";

const TOKEN_KEY = "relay_token";

export async function saveToken(token: string) {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function loadToken() {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function clearToken() {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

export async function login(email: string, password: string) {
  const data = await api<{ token: string; user: { id: string; name: string; role: string } }>(
    "/api/auth/token",
    {
      method: "POST",
      body: JSON.stringify({ email, password }),
    },
  );
  await saveToken(data.token);
  return data;
}
