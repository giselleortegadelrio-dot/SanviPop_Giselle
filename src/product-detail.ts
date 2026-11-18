import { AuthService } from "./classes/auth-service";
import { ErrorUtils } from "./classes/error-utils";
import { Formatters } from "./classes/formatters";
import { MapService } from "./classes/map-service";
import { ProductsService } from "./classes/products-service";
import type { Product } from "./interfaces/product";
import type { User } from "./interfaces/user";

const authService = new AuthService();
const productsService = new ProductsService();

const mainPhoto = document.getElementById("mainPhoto") as HTMLImageElement;
const category = document.getElementById("category") as HTMLSpanElement;
const statusBadge = document.getElementById("status") as HTMLSpanElement;
const bookmarkBtn = document.getElementById("bookmarkBtn") as HTMLButtonElement;
const title = document.getElementById("title") as HTMLHeadingElement;
const price = document.getElementById("price") as HTMLHeadingElement;
const description = document.getElementById(
  "description"
) as HTMLParagraphElement;
const buyBtn = document.getElementById("buyProduct") as HTMLButtonElement;
const deleteBtn = document.getElementById("deleteProduct") as HTMLButtonElement;
const datePublished = document.getElementById(
  "datePublished"
) as HTMLSpanElement;
const numVisits = document.getElementById("numVisits") as HTMLSpanElement;
const distance = document.getElementById("distance") as HTMLSpanElement;
const ownerPhoto = document.getElementById("ownerPhoto") as HTMLImageElement;
const ownerName = document.getElementById("ownerName") as HTMLDivElement;
const ownerEmail = document.getElementById("ownerEmail") as HTMLElement;
const transactionCard = document.getElementById(
  "transactionCard"
) as HTMLDivElement;
const logoutLink = document.getElementById("logout") as HTMLAnchorElement;

/** Texto y color de la etiqueta según el estado del producto. */
const STATUSES: Record<Product["status"], { text: string; badge: string }> = {
  1: { text: "On sale", badge: "bg-success" },
  2: { text: "Reserved", badge: "bg-warning text-dark" },
  3: { text: "Sold", badge: "bg-danger" },
};

// El id del producto llega en la URL (product-detail.html?id=5)
const idParam = new URLSearchParams(location.search).get("id");
const productId = Number(idParam);

/** Cambia el aspecto del botón de favoritos. */
function renderBookmark(bookmarked: boolean): void {
  const icon = document.createElement("i");
  icon.className = bookmarked ? "bi bi-bookmark-fill" : "bi bi-bookmark";

  bookmarkBtn.classList.toggle("active", bookmarked);
  bookmarkBtn.title = bookmarked ? "Saved in favorites" : "Add to favorites";
  bookmarkBtn.replaceChildren(icon, bookmarked ? " Saved" : " Save");
}

/**
 * Rellena la página con los datos del producto.
 * @param product Producto a mostrar.
 */
function showProduct(product: Product): void {
  const status = STATUSES[product.status];

  mainPhoto.src = product.mainPhoto;
  mainPhoto.alt = product.title;
  category.textContent = product.category.name;
  statusBadge.textContent = status.text;
  statusBadge.className = `badge ${status.badge}`;
  title.textContent = product.title;
  price.textContent = Formatters.price.format(product.price);
  description.textContent = product.description;
  datePublished.textContent = Formatters.dateTime.format(
    new Date(product.datePublished)
  );
  numVisits.textContent = String(product.numVisits);
  distance.textContent = Formatters.distance.format(product.distance);

  ownerPhoto.src = product.owner.photo;
  ownerPhoto.alt = product.owner.name;
  ownerName.textContent = product.owner.name;
  ownerEmail.textContent = product.owner.email;

  renderBookmark(product.bookmarked);

  // Comprar: solo si está en venta y no es tuyo. Borrar: solo si es tuyo.
  buyBtn.classList.toggle("d-none", product.status !== 1 || product.mine);
  deleteBtn.classList.toggle("d-none", !product.mine);

  // Temporal: la tarjeta de venta y valoraciones se completa en la parte 2
  transactionCard.classList.add("d-none");
}

/**
 * Envuelve un elemento en un enlace al perfil de un usuario.
 * @param element Elemento que se convierte en enlace.
 * @param userId Id del usuario al que lleva el enlace.
 */
function linkToProfile(element: HTMLElement, userId: number): void {
  const link = document.createElement("a");
  link.href = `profile.html?id=${userId}`;
  link.classList.add("text-reset", "text-decoration-none");
  element.replaceWith(link);
  link.append(element);
}

/**
 * Muestra en el mapa la ubicación del vendedor.
 * @param owner Vendedor del producto.
 */
function showSellerLocation(owner: User): void {
  const coordinates = { latitude: owner.lat, longitude: owner.lng };
  const mapService = new MapService(coordinates, "map");
  mapService.createMarker(coordinates);
}

bookmarkBtn.addEventListener("click", async (): Promise<void> => {
  const bookmarked = bookmarkBtn.classList.contains("active");

  try {
    if (bookmarked) {
      await productsService.removeBookmark(productId);
    } else {
      await productsService.addBookmark(productId);
    }
    renderBookmark(!bookmarked);
  } catch (error) {
    alert(ErrorUtils.getMessage(error, "Could not update the favorites"));
  }
});

buyBtn.addEventListener("click", async (): Promise<void> => {
  if (!confirm("Do you want to buy this product?")) return;

  try {
    await productsService.buy(productId);
    // La respuesta de comprar está vacía: volvemos a pedir el producto
    showProduct(await productsService.get(productId));
  } catch (error) {
    alert(ErrorUtils.getMessage(error, "Could not buy the product"));
  }
});

deleteBtn.addEventListener("click", async (): Promise<void> => {
  if (!confirm("Do you want to delete this product?")) return;

  try {
    await productsService.delete(productId);
    location.assign("index.html");
  } catch (error) {
    alert(ErrorUtils.getMessage(error, "Could not delete the product"));
  }
});

logoutLink.addEventListener("click", (event: Event): void => {
  event.preventDefault();
  authService.logout();
  location.assign("login.html");
});

/** Comprueba la sesión y el id, y carga el producto. */
async function init(): Promise<void> {
  if (!idParam) {
    location.assign("index.html");
    return;
  }

  try {
    await authService.checkToken();
  } catch {
    location.assign("login.html");
    return;
  }

  try {
    const product = await productsService.get(productId);
    showProduct(product);
    linkToProfile(ownerPhoto, product.owner.id);
    linkToProfile(ownerName, product.owner.id);
    showSellerLocation(product.owner);
  } catch (error) {
    alert(ErrorUtils.getMessage(error, "Could not load the product"));
    location.assign("index.html");
  }
}

init().catch(console.error);
