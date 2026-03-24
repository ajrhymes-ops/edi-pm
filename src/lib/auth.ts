import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

const allowedEmails = (process.env.ALLOWED_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [Google],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    signIn({ profile }) {
      if (allowedEmails.length === 0) return true;
      const email = profile?.email?.toLowerCase() ?? "";
      return allowedEmails.includes(email);
    },
    session({ session }) {
      return session;
    },
  },
});
