export const ACCESS_TOKEN_COOKIE = "lex_access_token";
export const REFRESH_TOKEN_COOKIE = "lex_refresh_token";

export type SessionUser = {
  id: string;
  nombres: string;
  apellidos: string;
  nombreCompleto: string;
  email: string;
  telefono: string | null;
  estado: string;
  ultimoAcceso: string | null;
  rol: {
    id: string;
    nombre: string;
    descripcion: string | null;
  };
  permisos: string[];
};

export type SessionEnvelope = {
  ok: boolean;
  mensaje?: string;
  codigo?: string;
  data?: {
    user: SessionUser;
  };
};
