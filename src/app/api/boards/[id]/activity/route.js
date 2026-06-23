import { connectDB } from "@/lib/mongodb";
import Activity from "@/models/Activity";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
export async function GET(request, { params }) {
  await connectDB();
  const session = await getServerSession(authOptions);
  if (!session)
    return Response.json({ error: "Nincs bejelentkezve!" }, { status: 401 });
  const { id } = await params;
  const activities = await Activity.find({ boardId: id })
    .sort({ createdAt: -1 })
    .limit(50); // csak az utolsó 50 esemény
  return Response.json(activities);
}
