import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { readSecret } from "./secretManager.js";

let signingKey: string | undefined;

const getSigningKey = async () => {
  if (!signingKey) {
    signingKey = await readSecret(env.jwtSigningKeySecret, env.projectId);
  }
  return signingKey;
};

export type AccessTokenPayload = {
  sub: string;
  username: string;
  role: "admin";
};

export const signAccessToken = async (payload: AccessTokenPayload) => {
  const key = await getSigningKey();
  return jwt.sign(payload, key, {
    algorithm: env.jwtAlgorithm,
    expiresIn: env.accessTokenTtlSeconds,
  });
};

export const verifyAccessToken = async (token: string): Promise<AccessTokenPayload> => {
  const key = await getSigningKey();
  return jwt.verify(token, key, { algorithms: [env.jwtAlgorithm] }) as AccessTokenPayload;
};
