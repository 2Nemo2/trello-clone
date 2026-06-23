import { connectDB } from "@/lib/mongodb";
import List from "@/models/List";
export async function POST(request) {
  await connectDB();
  const body = await request.json();
  const updates = body.lists.map(({ _id, order }) =>
    List.findByIdAndUpdate(_id, { order }),
  );
  await Promise.all(updates);
  return Response.json({ success: true });
}
