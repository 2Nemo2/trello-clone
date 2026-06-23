import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
export async function GET(request) {
  await connectDB();
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");
  if (!token) {
    return Response.redirect(
      new URL("/login?error=invalid_token", request.url),
    );
  }
  const user = await User.findOne({ verificationToken: token });
  if (!user) {
    return Response.redirect(
      new URL("/login?error=invalid_token", request.url),
    );
  }
  await User.findByIdAndUpdate(user._id, {
    emailVerified: true,
    verificationToken: null,
  });
  return Response.redirect(new URL("/login?verified=true", request.url));
}
