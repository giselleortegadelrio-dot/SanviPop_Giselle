import { AuthService } from "./classes/auth-service";
import { ErrorUtils } from "./classes/error-utils";
import { Formatters } from "./classes/formatters";
import { MapService } from "./classes/map-service";
import { ProductsService } from "./classes/products-service";
import { RatingsService } from "./classes/ratings-service";
import { UserService } from "./classes/user-service";
import type { Product } from "./interfaces/product";
import type { RatingInsert } from "./interfaces/rating";
import type { User } from "./interfaces/user";

const authService = new AuthService();
const productsService = new ProductsService();
const ratingsService = new RatingsService();
const userService = new UserService();

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
const ratingsRow = document.getElementById("ratingsRow") as HTMLDivElement;
const pendingRatingCard = document.getElementById(
  "pendingRatingCard"
) as HTMLDivElement;
const rateBtn = document.getElementById(
  "btnRateTransaction"
) as HTMLButtonElement;
const ratingFormContainer = document.getElementById(
  "ratingFormContainer"
) as HTMLDivElement;
const ratingForm = document.getElementById("ratingForm") as HTMLFormElement;
const cancelRatingBtn = document.getElementById(
  "btnCancelRating"
) as HTMLButtonElement;
const dateTransaction = document.getElementById(
  "dateTransaction"
) as HTMLSpanElement;
const ratingTemplate = document.getElementById(
  "ratingTemplate"
) as HTMLTemplateElement;
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
 * Indica si el usuario autenticado es el comprador del producto.
 * @param product Producto a comprobar.
 */
async function isBuyer(product: Product): Promise<boolean> {
  if (product.mine || !product.soldTo) return false;
  const me = await userService.getProfile();
  return product.soldTo.id === me.id;
}

/**
 * Crea la tarjeta con la valoración de uno de los participantes.
 * @param role Texto que indica el papel: "Buyer" o "Seller".
 * @param user Usuario que hizo la valoración.
 * @param score Puntuación de 1 a 5.
 * @param comment Comentario de la valoración.
 */
function createRatingCard(
  role: string,
  user: User,
  score: number,
  comment: string
): DocumentFragment {
  const fragment = ratingTemplate.content.cloneNode(true) as DocumentFragment;

  const photo = fragment.querySelector(".rating-photo") as HTMLImageElement;
  const userName = fragment.querySelector(".rating-name") as HTMLDivElement;
  const email = fragment.querySelector(".rating-email") as HTMLElement;
  const stars = fragment.querySelector(".rating-stars") as HTMLSpanElement;
  const scoreBadge = fragment.querySelector(".rating-score") as HTMLSpanElement;
  const commentText = fragment.querySelector(
    ".rating-comment"
  ) as HTMLParagraphElement;

  photo.src = user.photo;
  photo.alt = user.name;
  userName.textContent = `${role}: ${user.name}`;
  email.textContent = user.email;
  stars.textContent = "★".repeat(score) + "☆".repeat(5 - score);
  scoreBadge.textContent = `${score} / 5`;
  commentText.textContent = `"${comment}"`;

  return fragment;
}

/**
 * Muestra la tarjeta de venta y valoraciones (solo si el producto está vendido).
 * @param product Producto a mostrar.
 */
async function showTransaction(product: Product): Promise<void> {
  const sold = product.status === 3;
  transactionCard.classList.toggle("d-none", !sold);
  if (!sold) return;

  // Al repintar (tras comprar o valorar) quitamos las valoraciones anteriores
  ratingsRow.querySelectorAll(".rating-card").forEach(card => card.remove());

  const buyerRating = product.rating?.buyerRating;
  const sellerRating = product.rating?.sellerRating;
  const transactionDate = product.rating?.dateTransaction;

  dateTransaction.textContent = transactionDate
    ? Formatters.dateTime.format(new Date(transactionDate))
    : "";

  const cards: DocumentFragment[] = [];
  if (product.soldTo && typeof buyerRating === "number") {
    cards.push(
      createRatingCard(
        "Buyer",
        product.soldTo,
        buyerRating,
        product.rating?.buyerComment ?? ""
      )
    );
  }
  if (typeof sellerRating === "number") {
    cards.push(
      createRatingCard(
        "Seller",
        product.owner,
        sellerRating,
        product.rating?.sellerComment ?? ""
      )
    );
  }
  // Las valoraciones van al principio, antes del aviso de valoración pendiente
  ratingsRow.prepend(...cards);

  // Aviso de pendiente: solo si participas en la venta y aún no has valorado
  const hasRated = product.mine
    ? typeof sellerRating === "number"
    : typeof buyerRating === "number";
  const canRate = product.mine || (await isBuyer(product));

  pendingRatingCard.classList.toggle("d-none", !canRate || hasRated);
  ratingFormContainer.classList.add("d-none");
}

/**
 * Rellena la página con los datos del producto.
 * @param product Producto a mostrar.
 */
async function showProduct(product: Product): Promise<void> {
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

  await showTransaction(product);
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
    await showProduct(await productsService.get(productId));
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

rateBtn.addEventListener("click", (): void => {
  ratingFormContainer.classList.remove("d-none");
  pendingRatingCard.classList.add("d-none");
});

cancelRatingBtn.addEventListener("click", (): void => {
  ratingForm.reset();
  ratingFormContainer.classList.add("d-none");
  pendingRatingCard.classList.remove("d-none");
});

ratingForm.addEventListener("submit", async (event: Event): Promise<void> => {
  event.preventDefault();

  // El formulario tiene novalidate, así que validamos nosotros
  if (!ratingForm.reportValidity()) return;

  const score = (ratingForm.elements.namedItem("ratingScore") as RadioNodeList)
    .value;
  const comment = (
    ratingForm.elements.namedItem("ratingComment") as HTMLTextAreaElement
  ).value.trim();

  const rating: RatingInsert = {
    rating: Number(score),
    comment,
    product: productId,
  };

  try {
    await ratingsService.post(rating);
    ratingForm.reset();
    await showProduct(await productsService.get(productId));
  } catch (error) {
    alert(ErrorUtils.getMessage(error, "Could not send the review"));
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
    await showProduct(product);
    linkToProfile(ownerPhoto, product.owner.id);
    linkToProfile(ownerName, product.owner.id);
    showSellerLocation(product.owner);
  } catch (error) {
    alert(ErrorUtils.getMessage(error, "Could not load the product"));
    location.assign("index.html");
  }
}

init().catch(console.error);
