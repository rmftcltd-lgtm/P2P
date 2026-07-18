import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6).max(72),
  name: z.string().min(2).max(80),
  phone: z.string().min(7).max(20).optional(),
  role: z.enum(["CUSTOMER", "DRIVER"]),
  vehicleType: z.enum(["bike", "scooter", "car", "van"]).optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const createDeliverySchema = z.object({
  pickupAddress: z.string().min(3),
  pickupLat: z.number().min(-90).max(90),
  pickupLng: z.number().min(-180).max(180),
  dropoffAddress: z.string().min(3),
  dropoffLat: z.number().min(-90).max(90),
  dropoffLng: z.number().min(-180).max(180),
  packageSize: z.enum(["SMALL", "MEDIUM", "LARGE"]).default("SMALL"),
  packageNotes: z.string().max(500).optional(),
});

export const locationSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  isOnline: z.boolean().optional(),
});

export const statusSchema = z.object({
  status: z.enum([
    "PICKED_UP",
    "IN_TRANSIT",
    "DELIVERED",
    "CANCELLED",
  ]),
  note: z.string().max(300).optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
});
