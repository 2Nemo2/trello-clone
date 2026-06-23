import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

// GET /api/users → összes user listája (hozzárendeléshez)

export async function GET() {
  await connectDB();
  const session = await getServerSession(authOptions);
  if (!session)
    return Response.json({ error: "Nincs bejelentkezve!" }, { status: 401 });
  // Csak nevet és emailt adunk vissza, jelszót soha!
  const users = await User.find({}, { name: 1, email: 1 }).lean();
  const usersWithStringId = users.map((u) => ({
    ...u,
    _id: u._id.toString(),
  }));
  return Response.json(usersWithStringId);
}
