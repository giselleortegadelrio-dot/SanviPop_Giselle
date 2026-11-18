import { SERVER } from "../constants";
import type { PhotoResponse, UserResponse } from "../interfaces/responses";
import type {
  User,
  UserPasswordEdit,
  UserPhotoEdit,
  UserProfileEdit,
} from "../interfaces/user";
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

  /**
   * Actualiza el nombre y el email del usuario autenticado.
   * @param name Nuevo nombre.
   * @param email Nuevo email.
   */
  async saveProfile(name: string, email: string): Promise<void> {
    await this.#http.put<null, UserProfileEdit>(`${SERVER}/users/me`, {
      name,
      email,
    });
  }

  /**
   * Actualiza la foto del usuario autenticado.
   * @param photo Nueva foto en base64.
   * @returns La URL de la foto guardada en el servidor.
   */
  async savePhoto(photo: string): Promise<string> {
    const resp = await this.#http.put<PhotoResponse, UserPhotoEdit>(
      `${SERVER}/users/me/photo`,
      { photo }
    );
    return resp.photo;
  }

  /**
   * Actualiza la contraseña del usuario autenticado.
   * @param password Nueva contraseña.
   */
  async savePassword(password: string): Promise<void> {
    await this.#http.put<null, UserPasswordEdit>(
      `${SERVER}/users/me/password`,
      { password }
    );
  }
}
