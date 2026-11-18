import { SERVER } from "../constants";
import type { RatingInsert } from "../interfaces/rating";
import type { SingleRatingResponse } from "../interfaces/responses";
import { Http } from "./http";

export class RatingsService {
  #http: Http;

  constructor() {
    this.#http = new Http();
  }

  /**
   * Envía la valoración de una transacción.
   * @param rating Puntuación, comentario e id del producto.
   */
  async post(rating: RatingInsert): Promise<void> {
    await this.#http.post<SingleRatingResponse, RatingInsert>(
      `${SERVER}/ratings`,
      rating
    );
  }
}
