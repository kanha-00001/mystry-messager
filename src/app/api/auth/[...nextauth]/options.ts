import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/dbconnect";
import UserModel from "@/model/User";

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            id: "credentials",
            name: "credentials",
            credentials: {
                identifier: { label: "Email or Username", type: "text" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials: any): Promise<any> {
                console.log("🚀 Received credentials:", credentials);

                await dbConnect();
                console.log("✅ Database connected");

                try {
                    const user = await UserModel.findOne({
                        $or: [
                            { email: credentials.identifier },
                            { username: credentials.identifier }
                        ]
                    });

                    console.log("🔍 User found:", user);

                    if (!user) {
                        console.warn("❌ No user found with this email or username");
                        return null;
                    }

                    if (!user.isVerified) {
                        console.warn("⚠️ User not verified");
                        return null;
                    }

                    const isPasswordCorrect = await bcrypt.compare(
                        credentials.password,
                        user.password
                    );

                    console.log("🔑 Password match:", isPasswordCorrect);

                    if (isPasswordCorrect) {
                        console.log("✅ Authentication successful");
                        return user;
                    } else {
                        console.warn("❌ Incorrect password");
                        return null;
                    }
                } catch (err: any) {
                    console.error("❌ Authorize error:", err);
                    return null;
                }
            }
        })
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                console.log("🧠 JWT callback - user info added to token");
                token._id = user._id?.toString();
                token.isVerified = user.isVerified;
                token.isAcceptingMessages = user.isAcceptingMessages;
                token.username = user.username;
            }
            return token;
        },

        async session({ session, token }) {
            if (token) {
                console.log("📦 Session callback - token data added to session");
                session.user._id = token._id;
                session.user.isVerified = token.isVerified;
                session.user.isAcceptingMessages = token.isAcceptingMessages;
                session.user.username = token.username;
            }
            return session;
        }
    },
    pages: {
        signIn: '/sign-in'
    },
    session: {
        strategy: "jwt"
    },
    secret: process.env.NEXTAUTH_SECRET
};
