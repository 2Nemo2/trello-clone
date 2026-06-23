import { connectDB } from "@/lib/mongodb";
import Notification from "@/models/Notification";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
// GET — saját értesítések lekérése
export async function GET() {
  await connectDB();
  const session = await getServerSession(authOptions);
  if (!session)
    return Response.json({ error: "Nincs bejelentkezve!" }, { status: 401 });
  const notifications = await Notification.find({ userId: session.user.id })
    .sort({ createdAt: -1 })
    .limit(20);
  return Response.json(notifications);
}
// PATCH — összes értesítés olvasottnak jelölése
export async function PATCH() {
  await connectDB();
  const session = await getServerSession(authOptions);
  if (!session)
    return Response.json({ error: "Nincs bejelentkezve!" }, { status: 401 });
  await Notification.updateMany(
    { userId: session.user.id, read: false },
    { read: true },
  );
  return Response.json({ success: true });
}
