export interface Principal {
  id: string;
  rol: "COORDINACION" | "ADMIN_IGLESIA" | "TESORERO";
  iglesiaId?: string;
}
