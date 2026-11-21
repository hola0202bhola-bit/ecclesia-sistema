import type { RequestHandler } from "express";

export type Surface = "all" | "api" | "front" | "admin";
export interface Deployment {
  surface?: Surface;
  frontOrigin?: string;
  adminOrigin?: string;
  proxyHops?: 0 | 1;
  requireLogin?: boolean;
}

function origin(value: string | undefined, required: boolean, https: boolean) {
  if (!value && !required) return undefined;
  try {
    const url = new URL(value!);
    if (
      !["http:", "https:"].includes(url.protocol) ||
      (https && url.protocol !== "https:") ||
      url.username ||
      url.password ||
      url.pathname !== "/" ||
      url.search ||
      url.hash ||
      url.origin !== value
    )
      throw new Error();
    return url.origin;
  } catch {
    throw new Error(
      "Configure un origen HTTP(S) exacto, sin ruta ni credenciales",
    );
  }
}

export function deploymentConfig(env: NodeJS.ProcessEnv) {
  const production = env.RENDER === "true" || env.NODE_ENV === "production";
  const surface = env.APP_SURFACE ?? "all";
  if (
    !["all", "api", "front", "admin"].includes(surface) ||
    (production && surface === "all")
  )
    throw new Error("Configure APP_SURFACE: api, front o admin en producción");
  const port = env.PORT ?? "3000";
  if (!/^\d+$/.test(port) || Number(port) < 1 || Number(port) > 65535)
    throw new Error("PORT inválido");
  const host = env.HOST ?? (env.RENDER === "true" ? "0.0.0.0" : "127.0.0.1");
  if (!["127.0.0.1", "0.0.0.0"].includes(host))
    throw new Error("HOST inválido");
  const proxy = env.TRUST_PROXY_HOPS ?? "0";
  if (!["0", "1"].includes(proxy))
    throw new Error("TRUST_PROXY_HOPS debe ser 0 o 1");
  if (!env.DATABASE_URL || !/^postgres(?:ql)?:\/\//.test(env.DATABASE_URL))
    throw new Error("Configure DATABASE_URL PostgreSQL");
  if (!env.JWT_SECRET || Buffer.byteLength(env.JWT_SECRET) < 32)
    throw new Error("Configure JWT_SECRET aleatorio de al menos 32 bytes");
  return {
    host,
    port: Number(port),
    origin: origin(
      env.APP_ORIGIN ??
        env.RENDER_EXTERNAL_URL ??
        (production ? undefined : `http://127.0.0.1:${port}`),
      true,
      production,
    )!,
    deployment: {
      surface: surface as Surface,
      requireLogin: true,
      proxyHops: Number(proxy) as 0 | 1,
      frontOrigin: origin(env.FRONT_ORIGIN, surface === "admin", production),
      adminOrigin: origin(env.ADMIN_ORIGIN, surface === "front", production),
    },
  };
}

// Solo GET/HEAD navegan entre sitios. Nunca reenviar cuerpos, cookies o secretos.
export function surfaceBoundary(config: Deployment): RequestHandler {
  return (req, res, next) => {
    const surface = config.surface ?? "all";
    const api = /^\/api\/v1(?:\/|$)/i.test(req.path);
    const admin = /^\/personal(?:\/|$)/i.test(req.path);
    const cuenta = /^\/cuenta(?:\/|$)/i.test(req.path);
    const front =
      /^\/(?:iglesias|ranking-patrimonial|solicitudes)(?:\/|$)/i.test(req.path);
    if (
      surface === "all" ||
      (surface === "api" && api) ||
      (surface === "admin" &&
        (admin ||
          req.path === "/" ||
          /^\/cuenta\/(?:perfil|logout)\/?$/i.test(req.path))) ||
      (surface === "front" &&
        (front ||
          cuenta ||
          req.path === "/" ||
          /^\/assets\//i.test(req.path))) ||
      (surface === "admin" && /^\/assets\//i.test(req.path))
    )
      return next();
    const destination =
      surface === "front" && admin
        ? config.adminOrigin
        : surface === "admin" && front
          ? config.frontOrigin
          : undefined;
    if (destination && ["GET", "HEAD"].includes(req.method)) {
      // Las consultas pueden contener datos sensibles: solo se conserva la ruta.
      res.redirect(302, destination + req.path);
      return;
    }
    res.status(404).json({
      code: "NO_IMPLEMENTADO",
      message: "Ruta no disponible",
      details: [],
    });
  };
}
