export class ImageUtils {
  /**
   * Lee un archivo de imagen y lo devuelve serializado en base64.
   * @param file Archivo seleccionado en un input de tipo file.
   */
  static toBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.addEventListener("load", () => resolve(reader.result as string));
      reader.addEventListener("error", () =>
        reject(new Error("Could not read the image"))
      );
      reader.readAsDataURL(file);
    });
  }
}
