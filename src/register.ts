import { AuthService } from "./classes/auth-service";
import { ImageUtils } from "./classes/image-utils";
import { MyGeolocation } from "./classes/my-geolocation";
import type { ErrorResponse } from "./interfaces/responses";
import type { RegisterData } from "./interfaces/user";

const authService = new AuthService();

const registerForm = document.getElementById(
  "form-register"
) as HTMLFormElement;
const nameInput = registerForm.elements.namedItem(
  "nameUser"
) as HTMLInputElement;
const emailInput = registerForm.elements.namedItem("email") as HTMLInputElement;
const email2Input = registerForm.elements.namedItem(
  "email2"
) as HTMLInputElement;
const passwordInput = registerForm.elements.namedItem(
  "password"
) as HTMLInputElement;
const latInput = registerForm.elements.namedItem("lat") as HTMLInputElement;
const lngInput = registerForm.elements.namedItem("lng") as HTMLInputElement;
const photoInput = registerForm.elements.namedItem("photo") as HTMLInputElement;
const imgPreview = document.getElementById("imgPreview") as HTMLImageElement;

// Si ya hay una sesión válida, no hace falta registrarse
authService
  .checkToken()
  .then(() => location.assign("index.html"))
  .catch(() => {
    // Sin sesión válida: nos quedamos en el registro
  });

// Rellenamos la ubicación (campos de solo lectura)
MyGeolocation.getLocation()
  .then(coords => {
    latInput.value = String(coords.latitude);
    lngInput.value = String(coords.longitude);
  })
  .catch(() => {
    latInput.placeholder = "Location not available";
    lngInput.placeholder = "Location not available";
  });

/** Marca el segundo email como inválido mientras no coincida con el primero. */
function validateEmails(): void {
  email2Input.setCustomValidity(
    emailInput.value === email2Input.value ? "" : "Emails must match"
  );
}

emailInput.addEventListener("input", validateEmails);
email2Input.addEventListener("input", validateEmails);

// Vista previa de la foto (en base64, que es lo que se enviará al servidor)
photoInput.addEventListener("change", async (): Promise<void> => {
  const file = photoInput.files?.[0];
  if (!file) {
    imgPreview.src = "";
    imgPreview.classList.add("d-none");
    return;
  }
  imgPreview.src = await ImageUtils.toBase64(file);
  imgPreview.classList.remove("d-none");
});

registerForm.addEventListener("submit", async (event: Event): Promise<void> => {
  event.preventDefault();

  const userInfo: RegisterData = {
    name: nameInput.value,
    email: emailInput.value,
    password: passwordInput.value,
    photo: imgPreview.src,
  };

  // La ubicación es opcional: solo se envía si se ha podido obtener
  if (latInput.value && lngInput.value) {
    userInfo.lat = Number(latInput.value);
    userInfo.lng = Number(lngInput.value);
  }

  try {
    await authService.register(userInfo);
    location.assign("login.html");
  } catch (error) {
    const { message, error: errorText } = error as ErrorResponse;
    alert(
      Array.isArray(message)
        ? message.join("\n")
        : (message ?? errorText ?? "Could not register")
    );
  }
});
