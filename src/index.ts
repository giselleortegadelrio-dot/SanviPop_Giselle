import { AuthService } from "./classes/auth-service";
import { ProductsService } from "./classes/products-service";
import type { Product } from "./interfaces/product";

const authService = new AuthService();
const productsService = new ProductsService();

const searchForm = document.getElementById("searchForm") as HTMLFormElement;
const searchInput = searchForm.elements.namedItem("search") as HTMLInputElement;
const orderSelect = searchForm.elements.namedItem("order") as HTMLSelectElement;
const filterInfo = document.getElementById("filterInfo") as HTMLDivElement;
const productsContainer = document.getElementById(
  "productsContainer"
) as HTMLDivElement;
const productTemplate = document.getElementById(
  "productTemplate"
) as HTMLTemplateElement;
const loadMoreButton = document.getElementById("loadMore") as HTMLButtonElement;
const logoutLink = document.getElementById("logout") as HTMLAnchorElement;

const dateFormatter = new Intl.DateTimeFormat("es-ES", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});
const priceFormatter = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
});
const distanceFormatter = new Intl.NumberFormat("es-ES", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

// Filtros que llegan en la URL (por ejemplo, index.html?user=31&status=selling)
const urlParams = new URLSearchParams(location.search);
const userFilter = urlParams.get("user");
const statusFilter = urlParams.get("status");

// Estado actual de la búsqueda
let page = 1;
let search = "";
let sort = "distance";

/**
 * Crea la tarjeta de un producto a partir de la plantilla.
 * @param product Producto a mostrar.
 */
function createProductCard(product: Product): DocumentFragment {
  const fragment = productTemplate.content.cloneNode(true) as DocumentFragment;

  const card = fragment.querySelector(".col") as HTMLDivElement;
  const imageLink = fragment.querySelector(
    ".product-img-link"
  ) as HTMLAnchorElement;
  const image = fragment.querySelector(".card-img-top") as HTMLImageElement;
  const category = fragment.querySelector(".badge") as HTMLSpanElement;
  const price = fragment.querySelector(".fs-5") as HTMLSpanElement;
  const title = fragment.querySelector(".card-title") as HTMLAnchorElement;
  const description = fragment.querySelector(
    ".card-text"
  ) as HTMLParagraphElement;
  const avatarLink = fragment.querySelector(
    ".avatar-link"
  ) as HTMLAnchorElement;
  const avatar = fragment.querySelector(".avatar-link img") as HTMLImageElement;
  const ownerName = fragment.querySelector(".name") as HTMLAnchorElement;
  const date = fragment.querySelector("small.text-muted") as HTMLElement;
  const deleteButton = fragment.querySelector(".delete") as HTMLButtonElement;
  const views = fragment.querySelector(".views") as HTMLSpanElement;
  const distance = fragment.querySelector(".distance") as HTMLElement;

  const productUrl = `product-detail.html?id=${product.id}`;
  const ownerUrl = `profile.html?id=${product.owner.id}`;

  imageLink.href = productUrl;
  image.src = product.mainPhoto;
  image.alt = product.title;
  category.textContent = product.category.name;
  price.textContent = priceFormatter.format(product.price);
  title.href = productUrl;
  title.textContent = product.title;
  description.textContent = product.description;
  avatarLink.href = ownerUrl;
  avatar.src = product.owner.photo;
  avatar.alt = product.owner.name;
  ownerName.href = ownerUrl;
  ownerName.textContent = product.owner.name;
  date.textContent = dateFormatter.format(new Date(product.datePublished));
  views.textContent = String(product.numVisits);
  distance.textContent = `${distanceFormatter.format(product.distance)} km`;

  // Solo el propietario puede borrar el producto
  if (product.mine) {
    deleteButton.addEventListener("click", async (): Promise<void> => {
      if (!confirm(`Do you want to delete "${product.title}"?`)) return;

      try {
        await productsService.delete(product.id);
        card.remove();
      } catch (error) {
        console.error(error);
        alert("Could not delete the product");
      }
    });
  } else {
    deleteButton.classList.add("d-none");
  }

  return fragment;
}

/** Muestra debajo del buscador los filtros que están activos. */
function updateFilterInfo(): void {
  const filter = search ? `Filtered by "${search}"` : "Showing all products";
  filterInfo.textContent = `${filter}. Sorted by ${sort}.`;
}

/** Pide al servidor la página actual y la añade a la lista. */
async function loadProducts(): Promise<void> {
  try {
    const resp = await productsService.getAll(
      page,
      search,
      sort,
      userFilter,
      statusFilter
    );

    // La lista solo se vacía al aplicar un filtro nuevo (página 1)
    if (page === 1) productsContainer.replaceChildren();
    productsContainer.append(
      ...resp.products.map(product => createProductCard(product))
    );

    loadMoreButton.classList.toggle("d-none", page >= resp.total_pages);
  } catch (error) {
    console.error(error);
    alert("Could not load the products");
  }
}

searchForm.addEventListener("submit", async (event: Event): Promise<void> => {
  event.preventDefault();
  search = searchInput.value.trim();
  sort = orderSelect.value;
  page = 1;
  updateFilterInfo();
  await loadProducts();
});

loadMoreButton.addEventListener("click", async (): Promise<void> => {
  page++;
  await loadProducts();
});

logoutLink.addEventListener("click", (event: Event): void => {
  event.preventDefault();
  authService.logout();
  location.assign("login.html");
});

/** Comprueba la sesión y, si es válida, carga los productos. */
async function init(): Promise<void> {
  try {
    await authService.checkToken();
  } catch {
    location.assign("login.html");
    return;
  }
  await loadProducts();
}

init().catch(console.error);
