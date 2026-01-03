import { Router } from "express";
import { env } from "../config/env.js";
import { signAccessToken } from "../lib/jwt.js";
import {
  findAdminById,
  findAdminByUsername,
  validateAdminPassword,
} from "../models/adminUsers.js";
import { issueRefreshToken, rotateRefreshToken } from "../models/refreshTokens.js";

export const authRouter = Router();

authRouter.post("/login", async (req, res) => {
  const { username, password } = req.body ?? {};
  if (!username || !password) {
    return res.status(400).json({ error: "username and password are required" });
  }

  const user = await findAdminByUsername(username);
  if (!user) return res.status(401).json({ error: "Invalid credentials" });
  const valid = await validateAdminPassword(user, password);
  if (!valid) return res.status(401).json({ error: "Invalid credentials" });

  const accessToken = await signAccessToken({
    sub: user.id,
    username: user.username,
    role: "admin",
  });
  const refresh = await issueRefreshToken(user.id);

  return res.json({
    accessToken,
    expiresIn: env.accessTokenTtlSeconds,
    refreshToken: refresh.token,
    refreshExpiresAt: refresh.expiresAt.toISOString(),
  });
});

authRouter.post("/refresh", async (req, res) => {
  const { refreshToken } = req.body ?? {};
  if (!refreshToken) return res.status(400).json({ error: "refreshToken is required" });

  try {
    const rotation = await rotateRefreshToken(refreshToken);
    const user = await findAdminById(rotation.userId);
    if (!user) return res.status(401).json({ error: "Admin not found for token" });

    const accessToken = await signAccessToken({
      sub: user.id,
      username: user.username,
      role: "admin",
    });

    return res.json({
      accessToken,
      expiresIn: env.accessTokenTtlSeconds,
      refreshToken: rotation.token,
      refreshExpiresAt: rotation.expiresAt.toISOString(),
    });
  } catch (error) {
    console.error("Refresh failed", error);
    return res.status(401).json({ error: "Invalid refresh token" });
  }
});
