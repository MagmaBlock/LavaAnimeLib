import { JWTAuth } from "../src/class/auth/jwt";

export const useAuth = new JWTAuth(process.env.AUTH_SECRET);
