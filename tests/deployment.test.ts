import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import request from "supertest";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { createApp } from "../src/composition/app.js";
import {
  deploymentConfig,
  type Surface,
} from "../src/composition/deployment.js";

const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});
const origin = "https://admin.example.test";
const config = {
  secret: process.env.TEST_JWT_SECRET!,
  issuer: "ecclesia-personal",
  audience: "ecclesia-api",
  origin,
};
const make = (surface: Surface, proxyHops: 0 | 1 = 0) =>
  createApp(db, config, 2026, undefined, undefined, {
    surface,
    frontOrigin: "https://front.example.test",
    adminOrigin: origin,
    proxyHops,
  });
const password = "Prueba aislada Render 2026!";
beforeAll(async () => {
  await db.usuario.deleteMany();
  await db.usuario.create({
    data: {
      identificador: "render.coordinacion",
      rol: "COORDINACION",
      passwordHash: await bcrypt.hash(password, 12),
    },
  });
});
afterAll(async () => {
  await db.usuario.deleteMany();
  await db.$disconnect();
});

describe("separación Render y sesiones PostgreSQL", () => {
  it.each(["api", "front", "admin"] as const)(
    "salud %s sin secretos y fallo de BD cerrado",
    async (surface) => {
      const app = make(surface);
      expect((await request(app).get("/health/live")).body).toEqual({
        status: "ok",
      });
      expect((await request(app).get("/health/ready")).status).toBe(200);
      const fail = vi
        .spyOn(db, "$queryRaw")
        .mockRejectedValueOnce(new Error("detalle privado"));
      const r = await request(app).get("/health/ready");
      expect(r.status).toBe(503);
      expect(r.body).toEqual({ status: "unavailable" });
      fail.mockRestore();
    },
  );
  it("API sirve JSON y rechaza páginas, assets y rutas parecidas", async () => {
    const app = make("api");
    expect(
      (await request(app).get("/api/v1/iglesias?estadoClave=21")).status,
    ).toBe(200);
    for (const path of [
      "/",
      "/iglesias",
      "/personal/login",
      "/assets/ecclesia.css",
      "/api/v10/iglesias",
      "/API/v1x/iglesias",
    ])
      expect((await request(app).get(path)).status).toBe(404);
    expect((await request(app).get("/api/v1/usuarios")).status).toBe(401);
  });
  it("front conserva directorio público, CSS/CSP y enlace al admin", async () => {
    const app = make("front");
    const r = await request(app).get("/iglesias");
    expect(r.status).toBe(200);
    expect(r.text).toContain(origin + "/personal/login");
    expect(r.headers["content-security-policy"]).toContain(
      "form-action 'self'",
    );
    expect((await request(app).get("/assets/ecclesia.css")).status).toBe(200);
    expect((await request(app).get("/api/v1/iglesias")).status).toBe(404);
  });
  it("fronteras GET/HEAD no copian consultas ni permiten redirigir escrituras", async () => {
    const front = make("front"),
      admin = make("admin");
    expect(
      (await request(front).get("/personal/login?clave=secreto")).headers
        .location,
    ).toBe(origin + "/personal/login");
    expect((await request(front).head("/PERSONAL/login")).status).toBe(302);
    expect(
      (await request(admin).get("/iglesias?estadoClave=21")).headers.location,
    ).toBe("https://front.example.test/iglesias");
    for (const app of [front, admin]) {
      expect(
        (await request(app).post("/api/v1/auth/login").send({})).status,
      ).toBe(404);
      expect((await request(app).get("/desconocida")).status).toBe(404);
    }
    expect(
      (await request(front).post("/personal/login").send({ password })).status,
    ).toBe(404);
    expect((await request(admin).post("/solicitudes").send({})).status).toBe(
      404,
    );
    expect((await request(admin).get("/")).headers.location).toBe(
      "/personal/login",
    );
  });
  it("admin HTTPS mantiene cookie host-only, Origin/CSRF y revocación entre instancias", async () => {
    const admin = make("admin"),
      api = make("api");
    const login = await request(admin)
      .post("/personal/login")
      .set("Origin", origin)
      .type("form")
      .send({ identificador: "render.coordinacion", password });
    expect(login.status).toBe(303);
    const setCookie = login.headers["set-cookie"][0];
    expect(setCookie).toContain("HttpOnly");
    expect(setCookie).toContain("Secure");
    expect(setCookie).toContain("SameSite=Strict");
    expect(setCookie).not.toMatch(/Domain=/i);
    const cookie = setCookie.split(";")[0];
    const token = cookie.slice("ecclesia_session=".length);
    const page = await request(make("admin"))
      .get("/personal")
      .set("Cookie", cookie);
    expect(page.status).toBe(200);
    expect(page.text).toContain("https://front.example.test/iglesias");
    const me = await request(api)
      .get("/api/v1/auth/me")
      .auth(token, { type: "bearer" });
    expect(me.status).toBe(200);
    expect(
      (
        await request(admin)
          .post("/personal/logout")
          .set("Origin", origin)
          .set("Cookie", cookie)
          .type("form")
          .send({})
      ).status,
    ).toBe(403);
    expect(
      (
        await request(admin)
          .post("/personal/logout")
          .set("Origin", "https://front.example.test")
          .set("Cookie", cookie)
          .type("form")
          .send({ _csrf: me.body.csrfToken })
      ).status,
    ).toBe(403);
    expect(
      (
        await request(admin)
          .post("/personal/logout")
          .set("Origin", origin)
          .set("Cookie", cookie)
          .type("form")
          .send({ _csrf: me.body.csrfToken })
      ).status,
    ).toBe(303);
    expect(
      (
        await request(api)
          .get("/api/v1/auth/me")
          .auth(token, { type: "bearer" })
      ).status,
    ).toBe(401);
  });
  it("proxy explícito confía solo en el último salto", () => {
    const app = make("admin", 1);
    const trust = app.get("trust proxy fn");
    expect(trust("127.0.0.1", 0)).toBe(true);
    expect(trust("1.2.3.4", 1)).toBe(false);
    expect(make("admin").get("trust proxy")).toBe(0);
  });
});

describe("configuración de arranque antes de conectar", () => {
  const env = {
    DATABASE_URL: "postgresql://local/test",
    JWT_SECRET: "x".repeat(48),
  };
  it("Render obtiene origen propio y bind público con HTTPS", () => {
    const result = deploymentConfig({
      ...env,
      RENDER: "true",
      APP_SURFACE: "api",
      RENDER_EXTERNAL_URL: "https://api.example.invalid",
      TRUST_PROXY_HOPS: "1",
    });
    expect(result.host).toBe("0.0.0.0");
    expect(result.origin).toBe("https://api.example.invalid");
    expect(result.deployment.proxyHops).toBe(1);
  });
  it.each([
    { APP_SURFACE: "all" },
    { APP_ORIGIN: "http://api.example.invalid" },
    { APP_ORIGIN: "https://api.example.invalid/ruta" },
    { APP_ORIGIN: "https://usuario:clave@api.example.invalid" },
    { APP_ORIGIN: "https://api.example.invalid/" },
    { APP_SURFACE: "front" },
    { APP_SURFACE: "admin" },
    { APP_SURFACE: "front", ADMIN_ORIGIN: "https://admin.example.invalid?x=1" },
  ])("producción rechaza origen o superficie inválida %j", (extra) => {
    expect(() =>
      deploymentConfig({
        ...env,
        NODE_ENV: "production",
        APP_SURFACE: "api",
        APP_ORIGIN: "https://api.example.invalid",
        ...extra,
      }),
    ).toThrow();
  });
  it("local conserva loopback y Render usa 0.0.0.0, PORT y origen asignado", () => {
    expect(deploymentConfig(env).host).toBe("127.0.0.1");
    const c = deploymentConfig({
      ...env,
      RENDER: "true",
      APP_SURFACE: "api",
      PORT: "10000",
      RENDER_EXTERNAL_URL: "https://api.example.test",
      TRUST_PROXY_HOPS: "1",
    });
    expect(c.host).toBe("0.0.0.0");
    expect(c.port).toBe(10000);
    expect(c.origin).toBe("https://api.example.test");
  });
  it.each([
    { APP_SURFACE: "otro" },
    { PORT: "0" },
    { PORT: "65536" },
    { PORT: "3000abc" },
    { HOST: "publico" },
    { TRUST_PROXY_HOPS: "true" },
    { DATABASE_URL: "" },
    { JWT_SECRET: "corto" },
    { APP_ORIGIN: "https://user:pass@example.test" },
    { APP_ORIGIN: "https://example.test/ruta" },
    { APP_ORIGIN: "https://example.test?x=1" },
    { APP_ORIGIN: "https://example.test#x" },
    { APP_ORIGIN: "javascript:alert(1)" },
    { APP_SURFACE: "front" },
    { APP_SURFACE: "admin" },
    { NODE_ENV: "production" },
    {
      NODE_ENV: "production",
      APP_SURFACE: "api",
      APP_ORIGIN: "http://example.test",
    },
  ])("rechaza configuración inválida %j", (changes) => {
    expect(() => deploymentConfig({ ...env, ...changes })).toThrow();
  });
  it("acepta orígenes explícitos HTTPS y vincula destinos por configuración", () => {
    for (const surface of ["front", "admin"]) {
      const c = deploymentConfig({
        ...env,
        NODE_ENV: "production",
        APP_SURFACE: surface,
        APP_ORIGIN: "https://own.example.test",
        FRONT_ORIGIN: "https://front.example.test",
        ADMIN_ORIGIN: "https://admin.example.test",
      });
      expect(c.deployment.surface).toBe(surface);
    }
  });
});
