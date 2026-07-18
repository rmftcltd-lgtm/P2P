import { getSession, getUserWithDriver } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/api";

export async function GET() {
  const session = await getSession();
  if (!session) return jsonError("Unauthorized", 401);

  const user = await getUserWithDriver(session.id);
  if (!user) return jsonError("Unauthorized", 401);

  return jsonOk({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      role: user.role,
      driver: user.driver
        ? {
            isOnline: user.driver.isOnline,
            lat: user.driver.lat,
            lng: user.driver.lng,
            vehicleType: user.driver.vehicleType,
            rating: user.driver.rating,
            completedCount: user.driver.completedCount,
          }
        : null,
    },
  });
}
