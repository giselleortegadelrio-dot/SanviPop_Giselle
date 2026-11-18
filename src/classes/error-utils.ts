import type { ErrorResponse } from "../interfaces/responses";

export class ErrorUtils {
  /**
   * Obtiene el texto de un error devuelto por el servidor.
   * @param error Error capturado en un catch.
   * @param fallback Mensaje por defecto si el error no trae ninguno.
   */
  static getMessage(error: unknown, fallback: string): string {
    const { message, error: errorText } = error as ErrorResponse;
    if (Array.isArray(message)) return message.join("\n");
    return message ?? errorText ?? fallback;
  }
}
