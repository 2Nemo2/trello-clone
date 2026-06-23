import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { sendVerificationEmail } from "@/lib/notify";
export async function POST(request) {
  await connectDB();
  const body = await request.json();
  const existing = await User.findOne({ email: body.email });
  if (existing) {
    return Response.json(
      { error: "Ez az email már foglalt!" },
      { status: 400 },
    );
  }
  const hashedPassword = await bcrypt.hash(body.password, 12);
  // Egyedi token generálása
  const verificationToken = crypto.randomBytes(32).toString("hex");
  const user = await User.create({
    name: body.name,
    email: body.email,
    password: hashedPassword,
    verificationToken,
  });
  // Hitelesítő email küldése
  await sendVerificationEmail(body.email, body.name, verificationToken);
  return Response.json(
    { message: "Regisztráció sikeres! Ellenőrizd az email fiókodat." },
    { status: 201 },
  );
}
