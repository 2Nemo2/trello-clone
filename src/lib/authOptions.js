import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Jelszó", type: "password" },
      },
      async authorize(credentials) {
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });
        if (!user) throw new Error("Nincs ilyen felhasználó!");
        const isValid = await bcrypt.compare(
          credentials.password,
          user.password,
        );
        if (!isValid) throw new Error("Hibás jelszó!");
        if (!user.emailVerified)
          throw new Error("Kérlek hitelesítsd az email címedet!");
        return { id: user.id, name: user.name, email: user.email };
      },
    }),
  ],
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    async session({ session, token }) {
      if (token) session.user.id = token.id;
      return session;
    },
  },
  pages: { signIn: "/login" },
};
