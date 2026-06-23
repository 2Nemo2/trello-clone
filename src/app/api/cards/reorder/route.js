import { connectDB } from "@/lib/mongodb";
import Card from "@/models/Card";

// POST /api/cards/reorder → kártyák új sorrendjének mentése
export async function POST(request) {
  await connectDB();
  const body = await request.json();
  const updates = body.cards.map(({ _id, order, listId }) =>
    Card.findByIdAndUpdate(_id, { order, ...(listId && { listId }) }),
  );
  await Promise.all(updates);
  return Response.json({ success: true });
}
