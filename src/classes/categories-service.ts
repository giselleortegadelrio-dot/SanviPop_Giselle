import { SERVER } from "../constants";
import type { Category } from "../interfaces/category";
import type { CategoriesResponse } from "../interfaces/responses";
import { Http } from "./http";

export class CategoriesService {
  #http: Http;

  constructor() {
    this.#http = new Http();
  }

  /** Obtiene todas las categorías de productos. */
  async getAll(): Promise<Category[]> {
    const resp = await this.#http.get<CategoriesResponse>(
      `${SERVER}/categories`
    );
    return resp.categories;
  }
}
