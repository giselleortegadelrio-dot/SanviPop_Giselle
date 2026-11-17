import { SERVER } from "../constants";
import type { TokenResponse } from "../interfaces/responses";
import type { LoginData } from "../interfaces/user";
import { Http } from "./http";

export class AuthService {
  #http: Http;

  constructor() {
    this.#http = new Http();
  }

  /**
   * Inicia sesión y guarda el token en localStorage.
   * @param userLogin Email, contraseña y (opcional) ubicación del usuario.
   */
  async login(userLogin: LoginData): Promise<void> {
    const resp = await this.#http.post<TokenResponse, LoginData>(
      `${SERVER}/auth/login`,
      userLogin
    );
    localStorage.setItem("token", resp.accessToken);
  }

  /** Comprueba si el token guardado sigue siendo válido (si no, lanza error). */
  async checkToken(): Promise<void> {
    await this.#http.get<null>(`${SERVER}/auth/validate`);
  }

  /** Cierra sesión borrando el token guardado. */
  logout(): void {
    localStorage.removeItem("token");
  }
}
