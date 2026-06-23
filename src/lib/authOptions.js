import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Jelszó", type: "password" },
      },
      async authorize(credentials) {
        await connectDB();
        const user = await User.findOne({ email: credentials.email });
        if (!user) throw new Error("Nincs ilyen felhasználó!");
        const isValid = await bcrypt.compare(
          credentials.password,
          user.password,
        );
        if (!isValid) throw new Error("Hibás jelszó!");

        // Email hitelesítés ellenőrzése
        if (!user.emailVerified) {
          throw new Error("Kérlek hitelesítsd az email címedet!");
        }

        return { id: user._id.toString(), name: user.name, email: user.email };
      },
    }),
  ],
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    // A JWT token-be beletesszük a user ID-t
    async jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    // A session-be is beletesszük, hogy a kliensen is elérhető legyen
    async session({ session, token }) {
      if (token) session.user.id = token.id;
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
};
