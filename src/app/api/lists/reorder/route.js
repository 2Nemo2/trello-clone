import prisma from "@/lib/prisma";
export async function POST(request) {
  const body = await request.json();
  await Promise.all(
    body.lists.map(({ id, order }) =>
      prisma.list.update({
        where: { id },
        data: { order },
      }),
    ),
  );
  return Response.json({ success: true });
}
