import { SERVER } from "../constants";
import type { UserResponse } from "../interfaces/responses";
import type { User } from "../interfaces/user";
import { Http } from "./http";

export class UserService {
  #http: Http;

  constructor() {
    this.#http = new Http();
  }

  /**
   * Obtiene el perfil de un usuario.
   * @param id Id del usuario. Si no se indica, se obtiene el del usuario autenticado.
   */
  async getProfile(id?: number): Promise<User> {
    const resp = await this.#http.get<UserResponse>(
      `${SERVER}/users/${id ?? "me"}`
    );
    return resp.user;
  }
}
