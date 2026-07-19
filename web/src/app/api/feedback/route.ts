import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleApiError, jsonOk } from "@/lib/api";
import { z } from "zod";

const schema = z.object({
  name: z.string().max(80).optional(),
  email: z.email().optional(),
  message: z.string().min(5).max(2000),
});

export async function POST(req: Request) {
  try {
    const body = schema.parse(await req.json());
    const session = await getSession();
    const feedback = await prisma.userFeedback.create({
      data: {
        userId: session?.id,
        name: body.name ?? session?.name,
        email: body.email ?? session?.email,
        message: body.message,
      },
    });
    return jsonOk({ feedback: { id: feedback.id } }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
