import { NextRequest, NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import mongoose from "mongoose";
import { requireAuth } from "@/lib/auth/api-guards";

export const dynamic = "force-dynamic";

// Modelo do device token (cria sob demanda; idempotente por token).
const PushTokenSchema = new mongoose.Schema(
  {
    token: { type: String, required: true, unique: true, index: true },
    platform: { type: String, enum: ["ios", "android"], default: "ios" },
    userId: { type: String, index: true, default: null },
    bundleId: { type: String, default: "br.com.keumotos.app" },
    appVersion: { type: String, default: null },
    lastSeenAt: { type: Date, default: Date.now },
    createdAt: { type: Date, default: Date.now },
  },
  { collection: "push_tokens" }
);

const PushToken =
  (mongoose.models.PushToken as mongoose.Model<unknown>) ??
  mongoose.model("PushToken", PushTokenSchema);

interface RegisterBody {
  token: string;
  platform?: "ios" | "android";
  appVersion?: string;
}

export async function POST(req: NextRequest) {
  try {
    await connectMongo();
    const body = (await req.json()) as Partial<RegisterBody>;

    if (!body.token || typeof body.token !== "string" || body.token.length < 16) {
      return NextResponse.json(
        { error: "Token APNs inválido." },
        { status: 400 }
      );
    }
    if (body.token.length > 512) {
      return NextResponse.json(
        { error: "Token muito longo." },
        { status: 400 }
      );
    }

    const auth = await requireAuth(req);
    const userId = auth.ok ? auth.userId : null;

    const platform = body.platform === "android" ? "android" : "ios";
    const now = new Date();

    // Upsert por token (mesmo device, possivelmente diferente user)
    const doc = await PushToken.findOneAndUpdate(
      { token: body.token },
      {
        $set: {
          token: body.token,
          platform,
          userId,
          appVersion: body.appVersion ?? null,
          lastSeenAt: now,
        },
        $setOnInsert: { createdAt: now, bundleId: "br.com.keumotos.app" },
      },
      { upsert: true, new: true }
    ).lean();

    return NextResponse.json({ ok: true, id: (doc as { _id: unknown })._id });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro registrando push token";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await connectMongo();
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");
    if (!token) {
      return NextResponse.json({ error: "token obrigatório" }, { status: 400 });
    }
    await PushToken.deleteOne({ token });
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
