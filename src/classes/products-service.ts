import { SERVER } from "../constants";
import type { Product, ProductInsert } from "../interfaces/product";
import type {
  ProductsResponse,
  SingleProductResponse,
} from "../interfaces/responses";
import { Http } from "./http";

export class ProductsService {
  #http: Http;

  constructor() {
    this.#http = new Http();
  }

  /**
   * Obtiene una página de productos aplicando los filtros indicados.
   * @param page Número de página (empieza en 1).
   * @param search Texto a buscar en título o descripción.
   * @param sort Criterio de orden: distance, price o views.
   * @param user Id del usuario cuyos productos se consultan (opcional).
   * @param status Estado de los productos: selling, sold, bought o bookmarks (opcional).
   */
  async getAll(
    page: number,
    search: string,
    sort: string,
    user: string | null,
    status: string | null
  ): Promise<ProductsResponse> {
    const params = new URLSearchParams({ page: String(page), search, sort });
    if (user) params.append("user", user);
    if (status) params.append("status", status);

    return await this.#http.get<ProductsResponse>(
      `${SERVER}/products?${params.toString()}`
    );
  }

  /**
   * Crea un producto nuevo a nombre del usuario autenticado.
   * @param product Datos del producto, con la foto en base64.
   */
  async post(product: ProductInsert): Promise<Product> {
    const resp = await this.#http.post<SingleProductResponse, ProductInsert>(
      `${SERVER}/products`,
      product
    );
    return resp.product;
  }
  /**
   * Elimina un producto (solo puede hacerlo su propietario).
   * @param id Id del producto.
   */
  async delete(id: number): Promise<void> {
    await this.#http.delete<null>(`${SERVER}/products/${id}`);
  }
}
