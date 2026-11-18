import { AuthService } from "./classes/auth-service";
import { CategoriesService } from "./classes/categories-service";
import { ErrorUtils } from "./classes/error-utils";
import { ImageUtils } from "./classes/image-utils";
import { ProductsService } from "./classes/products-service";
import type { ProductInsert } from "./interfaces/product";

const authService = new AuthService();
const categoriesService = new CategoriesService();
const productsService = new ProductsService();

const newProductForm = document.getElementById("newProduct") as HTMLFormElement;
const titleInput = newProductForm.elements.namedItem(
  "title"
) as HTMLInputElement;
const descriptionInput = newProductForm.elements.namedItem(
  "description"
) as HTMLTextAreaElement;
const priceInput = newProductForm.elements.namedItem(
  "price"
) as HTMLInputElement;
const categorySelect = newProductForm.elements.namedItem(
  "category"
) as HTMLSelectElement;
const imageInput = newProductForm.elements.namedItem(
  "image"
) as HTMLInputElement;
const imgPreview = document.getElementById("imgPreview") as HTMLImageElement;
const logoutLink = document.getElementById("logout") as HTMLAnchorElement;

/** Rellena el desplegable con las categorías del servidor. */
async function loadCategories(): Promise<void> {
  try {
    const categories = await categoriesService.getAll();
    categorySelect.append(
      ...categories.map(category => {
        const option = document.createElement("option");
        option.value = String(category.id);
        option.textContent = category.name;
        return option;
      })
    );
  } catch (error) {
    alert(ErrorUtils.getMessage(error, "Could not load the categories"));
  }
}

// Vista previa de la foto (en base64, que es lo que se enviará al servidor)
imageInput.addEventListener("change", async (): Promise<void> => {
  const file = imageInput.files?.[0];
  if (!file) {
    imgPreview.src = "";
    imgPreview.classList.add("d-none");
    return;
  }
  imgPreview.src = await ImageUtils.toBase64(file);
  imgPreview.classList.remove("d-none");
});

newProductForm.addEventListener(
  "submit",
  async (event: Event): Promise<void> => {
    event.preventDefault();

    const product: ProductInsert = {
      title: titleInput.value.trim(),
      description: descriptionInput.value.trim(),
      price: Number(priceInput.value),
      category: Number(categorySelect.value),
      mainPhoto: imgPreview.src,
    };

    try {
      await productsService.post(product);
      location.assign("index.html");
    } catch (error) {
      alert(ErrorUtils.getMessage(error, "Could not create the product"));
    }
  }
);

logoutLink.addEventListener("click", (event: Event): void => {
  event.preventDefault();
  authService.logout();
  location.assign("login.html");
});

/** Comprueba la sesión y, si es válida, carga las categorías. */
async function init(): Promise<void> {
  try {
    await authService.checkToken();
  } catch {
    location.assign("login.html");
    return;
  }
  await loadCategories();
}

init().catch(console.error);
