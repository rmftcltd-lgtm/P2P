import { z } from "zod";

export const registerSchema = z.object({
  email: z.email(),
  password: z.string().min(6).max(72),
  name: z.string().min(2).max(80),
  phone: z.string().min(7).max(20).optional(),
  role: z.enum(["CUSTOMER", "DRIVER"]),
  vehicleType: z.enum(["bike", "scooter", "car", "van"]).optional(),
});

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

const spaceKey = z.enum([
  "shoebox",
  "frontseat",
  "backseat",
  "boot_sedan",
  "boot_hatch",
  "boot_other",
  "trailer",
]);

export const createDeliverySchema = z.object({
  pickupAddress: z.string().min(3),
  pickupLat: z.number().min(-90).max(90),
  pickupLng: z.number().min(-180).max(180),
  dropoffAddress: z.string().min(3),
  dropoffLat: z.number().min(-90).max(90),
  dropoffLng: z.number().min(-180).max(180),
  packageSize: z.enum(["SMALL", "MEDIUM", "LARGE"]).optional(),
  spaceNeeded: spaceKey.default("shoebox"),
  packageNotes: z.string().max(500).optional(),
  preferredDate: z.string().optional(),
  lonelyCover: z.boolean().optional(),
  tripId: z.string().optional(),
});

export const createTripSchema = z.object({
  tripType: z.enum(["ONE_WAY", "DAY_TRIP", "MULTI"]),
  fromAddress: z.string().min(3),
  fromLat: z.number().min(-90).max(90),
  fromLng: z.number().min(-180).max(180),
  toAddress: z.string().min(3),
  toLat: z.number().min(-90).max(90),
  toLng: z.number().min(-180).max(180),
  departAt: z.string().min(1),
  returnAt: z.string().optional(),
  spaces: z.array(spaceKey).min(1),
  vehicleType: z.enum(["bike", "scooter", "car", "van"]).default("car"),
  notes: z.string().max(500).optional(),
  /** Extra legs for MULTI listings */
  extraLegs: z
    .array(
      z.object({
        fromAddress: z.string().min(3),
        fromLat: z.number(),
        fromLng: z.number(),
        toAddress: z.string().min(3),
        toLat: z.number(),
        toLng: z.number(),
        departAt: z.string().min(1),
      }),
    )
    .optional(),
});

export const locationSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  isOnline: z.boolean().optional(),
});

export const statusSchema = z.object({
  status: z.enum(["PICKED_UP", "IN_TRANSIT", "DELIVERED", "CANCELLED"]),
  note: z.string().max(300).optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  dropoffPhotoUrl: z.string().optional(),
});

export const kycSchema = z.object({
  licenseNumber: z.string().min(4).max(40),
  idDocumentNote: z.string().min(3).max(200),
  vehicleType: z.enum(["bike", "scooter", "car", "van"]).optional(),
});

export const ratingSchema = z.object({
  stars: z.number().int().min(1).max(5),
  comment: z.string().max(400).optional(),
});

export const placesQuerySchema = z.object({
  q: z.string().min(2).max(120),
  limit: z.coerce.number().int().min(1).max(8).default(5),
});
