export interface Principal {
  id: string;
  rol: "COORDINACION" | "ADMIN_IGLESIA" | "TESORERO" | "VISITANTE";
  iglesiaId?: string;
}
