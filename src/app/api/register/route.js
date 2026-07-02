import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { sendVerificationEmail } from "@/lib/notify";
export async function POST(request) {
  const body = await request.json();
  const existing = await prisma.user.findUnique({
    where: { email: body.email },
  });
  if (existing) {
    return Response.json(
      { error: "Ez az email már foglalt!" },
      { status: 400 },
    );
  }
  const hashedPassword = await bcrypt.hash(body.password, 12);
  const verificationToken = crypto.randomBytes(32).toString("hex");
  await prisma.user.create({
    data: {
      name: body.name,
      email: body.email,
      password: hashedPassword,
      verificationToken,
    },
  });
  await sendVerificationEmail(body.email, body.name, verificationToken);
  return Response.json(
    { message: "Regisztráció sikeres! Ellenőrizd az email fiókodat." },
    { status: 201 },
  );
}
