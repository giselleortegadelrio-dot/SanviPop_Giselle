import { AuthService } from "./classes/auth-service";
import { ErrorUtils } from "./classes/error-utils";
import { ImageUtils } from "./classes/image-utils";
import { MapService } from "./classes/map-service";
import { UserService } from "./classes/user-service";
import type { User } from "./interfaces/user";

const authService = new AuthService();
const userService = new UserService();

const photo = document.getElementById("photo") as HTMLImageElement;
const photoInput = document.getElementById("photoInput") as HTMLInputElement;
const photoLabel = photoInput.closest("label") as HTMLLabelElement;

// Los ids "name" y "email" están repetidos en el HTML: buscamos dentro de cada zona
const profileInfo = document.getElementById("profileInfo") as HTMLDivElement;
const nameText = profileInfo.querySelector("#name") as HTMLHeadingElement;
const emailText = profileInfo.querySelector("#email small") as HTMLElement;
const editProfileBtn = document.getElementById(
  "editProfile"
) as HTMLButtonElement;
const editPasswordBtn = document.getElementById(
  "editPassword"
) as HTMLButtonElement;
const linkSelling = document.getElementById("linkSelling") as HTMLAnchorElement;
const linkSold = document.getElementById("linkSold") as HTMLAnchorElement;
const linkBought = document.getElementById("linkBought") as HTMLAnchorElement;
const linkFavorites = document.getElementById(
  "linkFavorites"
) as HTMLAnchorElement;

const profileFormBox = document.getElementById("profileForm") as HTMLDivElement;
const profileForm = profileFormBox.querySelector("form") as HTMLFormElement;
const nameInput = profileForm.elements.namedItem("name") as HTMLInputElement;
const emailInput = profileForm.elements.namedItem("email") as HTMLInputElement;
const cancelProfileBtn = document.getElementById(
  "cancelEditProfile"
) as HTMLButtonElement;

const passwordFormBox = document.getElementById(
  "passwordForm"
) as HTMLDivElement;
const passwordForm = passwordFormBox.querySelector("form") as HTMLFormElement;
const passwordInput = passwordForm.elements.namedItem(
  "password"
) as HTMLInputElement;
const password2Input = passwordForm.elements.namedItem(
  "password2"
) as HTMLInputElement;
const cancelPasswordBtn = document.getElementById(
  "cancelEditPassword"
) as HTMLButtonElement;

const logoutLink = document.getElementById("logout") as HTMLAnchorElement;

// Si la URL trae un id (profile.html?id=4) se muestra ese usuario; si no, el propio
const idParam = new URLSearchParams(location.search).get("id");
const profileId = idParam ? Number(idParam) : undefined;

/**
 * Muestra el nombre y el email en la página y en el formulario de edición.
 * @param name Nombre del usuario.
 * @param email Email del usuario.
 */
function renderNameAndEmail(name: string, email: string): void {
  nameText.textContent = name;
  emailText.textContent = email;

  // defaultValue permite restaurar estos valores con reset() al cancelar
  nameInput.defaultValue = name;
  nameInput.value = name;
  emailInput.defaultValue = email;
  emailInput.value = email;
}

/**
 * Rellena la página con los datos del usuario.
 * @param user Usuario a mostrar.
 */
function showProfile(user: User): void {
  photo.src = user.photo;
  photo.alt = user.name;
  renderNameAndEmail(user.name, user.email);

  linkSelling.href = `index.html?user=${user.id}&status=selling`;
  linkSold.href = `index.html?user=${user.id}&status=sold`;
  linkBought.href = `index.html?user=${user.id}&status=bought`;
  linkFavorites.href = `index.html?user=${user.id}&status=bookmarks`;

  // En el perfil de otra persona no se puede editar nada
  [editProfileBtn, editPasswordBtn, photoLabel].forEach(element =>
    element.classList.toggle("d-none", !user.me)
  );
}

/**
 * Muestra en el mapa la ubicación del usuario.
 * @param user Usuario a mostrar.
 */
function showLocation(user: User): void {
  const coordinates = { latitude: user.lat, longitude: user.lng };
  const mapService = new MapService(coordinates, "map");
  mapService.createMarker(coordinates);
}

/**
 * Alterna entre la información del perfil y uno de los formularios de edición.
 * @param formBox Contenedor del formulario que se muestra u oculta.
 * @param editing Si es true se muestra el formulario; si es false, la información.
 */
function toggleForm(formBox: HTMLDivElement, editing: boolean): void {
  profileInfo.classList.toggle("d-none", editing);
  formBox.classList.toggle("d-none", !editing);
}

/** Marca el segundo campo como inválido mientras no coincida con el primero. */
function validatePasswords(): void {
  password2Input.setCustomValidity(
    passwordInput.value === password2Input.value ? "" : "Passwords must match"
  );
}

editProfileBtn.addEventListener("click", (): void =>
  toggleForm(profileFormBox, true)
);

cancelProfileBtn.addEventListener("click", (): void => {
  profileForm.reset();
  toggleForm(profileFormBox, false);
});

editPasswordBtn.addEventListener("click", (): void =>
  toggleForm(passwordFormBox, true)
);

cancelPasswordBtn.addEventListener("click", (): void => {
  passwordForm.reset();
  password2Input.setCustomValidity("");
  toggleForm(passwordFormBox, false);
});

passwordInput.addEventListener("input", validatePasswords);
password2Input.addEventListener("input", validatePasswords);

profileForm.addEventListener("submit", async (event: Event): Promise<void> => {
  event.preventDefault();
  const name = nameInput.value.trim();
  const email = emailInput.value.trim();

  try {
    await userService.saveProfile(name, email);
    renderNameAndEmail(name, email);
    toggleForm(profileFormBox, false);
    alert("Profile updated successfully");
  } catch (error) {
    alert(ErrorUtils.getMessage(error, "Could not update the profile"));
  }
});

passwordForm.addEventListener("submit", async (event: Event): Promise<void> => {
  event.preventDefault();

  try {
    await userService.savePassword(passwordInput.value);
    passwordForm.reset();
    toggleForm(passwordFormBox, false);
    alert("Password updated successfully");
  } catch (error) {
    alert(ErrorUtils.getMessage(error, "Could not update the password"));
  }
});

photoInput.addEventListener("change", async (): Promise<void> => {
  const file = photoInput.files?.[0];
  if (!file) return;

  try {
    photo.src = await userService.savePhoto(await ImageUtils.toBase64(file));
    alert("Photo updated successfully");
  } catch (error) {
    alert(ErrorUtils.getMessage(error, "Could not update the photo"));
  }
  // Permite elegir de nuevo el mismo archivo si hiciera falta
  photoInput.value = "";
});

logoutLink.addEventListener("click", (event: Event): void => {
  event.preventDefault();
  authService.logout();
  location.assign("login.html");
});

/** Comprueba la sesión y carga el perfil. */
async function init(): Promise<void> {
  try {
    await authService.checkToken();
  } catch {
    location.assign("login.html");
    return;
  }

  try {
    const user = await userService.getProfile(profileId);
    showProfile(user);
    showLocation(user);
  } catch (error) {
    alert(ErrorUtils.getMessage(error, "Could not load the profile"));
    location.assign("index.html");
  }
}

init().catch(console.error);
