import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      role: string
    }
  }

  interface User {
    id: string
    email: string
    name: string
    role: string
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        })

        if (!user || !user.passwordHash || !user.isActive) {
          return null
        }

        const passwordMatch = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        )

        if (!passwordMatch) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
      }
      return session
    },
  },
  pages: {
    signIn: "/auth/login",
  },
  session: {
    strategy: "jwt",
  },
})


// ============================================
// Permission Helper Functions
// ============================================

export async function getAuthUser() {
  const session = await auth();
  
  if (!session?.user?.email) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
    },
  });

  if (!user || !user.isActive) {
    return null;
  }

  return user;
}

// Permission helpers
export function canManageUsers(role: string) {
  return role === 'ADMIN' || role === 'MANAGER';
}

export function canDeleteUsers(role: string) {
  return role === 'ADMIN'; // Only admin can delete
}

export function canManageTransactions(role: string) {
  return role === 'ADMIN' || role === 'MANAGER';
}

export function canApprovePayments(role: string) {
  return role === 'ADMIN' || role === 'MANAGER';
}

export function canViewAllData(role: string) {
  return role === 'ADMIN' || role === 'MANAGER';
}

export function isAdmin(role: string) {
  return role === 'ADMIN';
}

export function isManager(role: string) {
  return role === 'MANAGER';
}

export function isCleaner(role: string) {
  return role === 'CLEANER';
}
