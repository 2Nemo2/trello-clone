import prisma from "@/lib/prisma";
export async function POST(request) {
  const body = await request.json();
  await Promise.all(
    body.cards.map(({ id, order, listId }) =>
      prisma.card.update({
        where: { id },
        data: {
          order,
          ...(listId && { listId }),
        },
      }),
    ),
  );
  return Response.json({ success: true });
}
