import { connectDB } from "@/lib/mongodb";
import Activity from "@/models/Activity";
export async function logActivity({
  boardId,
  userId,
  userName,
  type,
  data = {},
}) {
  await connectDB();
  await Activity.create({ boardId, userId, userName, type, data });
}
