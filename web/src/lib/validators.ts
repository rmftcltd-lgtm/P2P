import { z } from "zod";

export const registerSchema = z.object({
  email: z.email(),
  password: z.string().min(6).max(72),
  name: z.string().min(2).max(80),
  phone: z.string().min(7).max(20).optional(),
  role: z.enum(["CUSTOMER", "DRIVER"]),
  vehicleType: z.string().min(1).max(40).optional(),
});

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

export const profileCompleteSchema = z.object({
  name: z.string().min(2).max(80),
  phone: z.string().min(7).max(20),
  physicalAddress: z.string().min(5).max(200),
  dateOfBirth: z.string().min(4).max(20).optional(),
  gender: z.enum(["Male", "Female", "Other"]).optional(),
  aboutMe: z.string().max(500).optional(),
  registrationType: z.enum(["INDIVIDUAL", "ORGANISATION"]).optional(),
  organisationName: z.string().max(120).optional(),
  nzbn: z.string().max(40).optional(),
});

const spaceKey = z.string().min(1).max(40);

export const createDeliverySchema = z.object({
  pickupAddress: z.string().min(3),
  pickupLat: z.number().min(-90).max(90),
  pickupLng: z.number().min(-180).max(180),
  dropoffAddress: z.string().min(3),
  dropoffLat: z.number().min(-90).max(90),
  dropoffLng: z.number().min(-180).max(180),
  packageSize: z.enum(["SMALL", "MEDIUM", "LARGE"]).optional(),
  spaceNeeded: spaceKey.default("shoebox"),
  itemTitle: z.string().max(80).optional(),
  packageNotes: z.string().max(500).optional(),
  preferredDate: z.string().optional(),
  preferredDropoffDate: z.string().optional(),
  timePreference: z.string().max(40).optional(),
  urgency: z.enum(["flexible", "week", "today"]).default("flexible"),
  marketplaceUrl: z.string().url().max(500).optional().or(z.literal("")),
  lengthCm: z.number().positive().max(500).optional(),
  widthCm: z.number().positive().max(500).optional(),
  fullyPackaged: z.boolean().optional(),
  greetAtPickup: z.boolean().optional(),
  greetAtDropoff: z.boolean().optional(),
  lonelyCover: z.boolean().optional(),
  donateBrake: z.boolean().optional(),
  donateTrees: z.boolean().optional(),
  tripId: z.string().optional(),
  /** When set, create a SENDER→DRIVER offer for this trip's driver */
  requestDriverId: z.string().optional(),
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
  vehicleType: z.string().min(1).max(40).default("car"),
  notes: z.string().max(500).optional(),
  listedPrice: z.number().positive().max(5000).optional(),
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

export const createOfferSchema = z.object({
  deliveryId: z.string().min(1),
  note: z.string().max(300).optional(),
  amount: z.number().positive().max(5000).optional(),
});

export const respondOfferSchema = z.object({
  action: z.enum(["accept", "reject"]),
});

export const messageSchema = z.object({
  body: z.string().min(1).max(1000),
  photoUrl: z.string().url().optional().or(z.literal("")),
});

export const cancelSchema = z.object({
  mode: z.enum(["MUTUAL", "FORCED"]),
  reason: z.string().min(3).max(400),
});

export const cancelRespondSchema = z.object({
  action: z.enum(["accept", "reject"]),
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
  pickupPhotoUrl: z.string().optional(),
  dropoffPhotoUrl: z.string().optional(),
});

export const kycSchema = z.object({
  licenseNumber: z.string().min(4).max(40),
  idDocumentNote: z.string().min(3).max(200),
  vehicleType: z.string().min(1).max(40).optional(),
});

export const ratingSchema = z.object({
  stars: z.number().int().min(1).max(5),
  comment: z.string().max(400).optional(),
});

export const placesQuerySchema = z.object({
  q: z.string().min(2).max(120),
  limit: z.coerce.number().int().min(1).max(8).default(5),
});

export const browseQuerySchema = z.object({
  fromLat: z.coerce.number().optional(),
  fromLng: z.coerce.number().optional(),
  toLat: z.coerce.number().optional(),
  toLng: z.coerce.number().optional(),
  space: spaceKey.optional(),
  sort: z
    .enum(["latest", "oldest", "price", "depart", "reviews"])
    .default("latest"),
  radiusKm: z.coerce.number().min(5).max(2500).default(80),
  date: z.enum(["flexible", "today", "tomorrow", "week"]).default("flexible"),
  urgency: z.enum(["flexible", "today", "week"]).optional(),
});