import prisma from "@/lib/prisma";
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");
  if (!token) {
    return Response.redirect(
      new URL("/login?error=invalid_token", request.url),
    );
  }
  const user = await prisma.user.findFirst({
    where: { verificationToken: token },
  });
  if (!user) {
    return Response.redirect(
      new URL("/login?error=invalid_token", request.url),
    );
  }
  await prisma.user.update({
    where: { id: user.id },
    data: { emailVerified: true, verificationToken: null },
  });
  return Response.redirect(new URL("/login?verified=true", request.url));
}
