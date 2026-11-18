export class Formatters {
  /** Fecha en formato español: 15/03/2026 */
  static readonly date = new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  /** Fecha y hora en formato español: 15/03/2026, 10:00 */
  static readonly dateTime = new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  /** Precio en euros: 150,50 € */
  static readonly price = new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
  });

  /** Distancia con dos decimales: 1,45 */
  static readonly distance = new Intl.NumberFormat("es-ES", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
