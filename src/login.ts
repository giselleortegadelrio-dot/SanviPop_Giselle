import { AuthService } from "./classes/auth-service";
import { MyGeolocation } from "./classes/my-geolocation";
import type { LoginData } from "./interfaces/user";

const authService = new AuthService();
const loginForm = document.getElementById("form-login") as HTMLFormElement;

// Si ya hay una sesión válida, no hace falta hacer login
authService
  .checkToken()
  .then(() => location.assign("index.html"))
  .catch(() => {
    // Sin sesión válida: nos quedamos en el login
  });

loginForm.addEventListener("submit", async (event: Event): Promise<void> => {
  event.preventDefault();

  const loginData: LoginData = {
    email: (loginForm.elements.namedItem("email") as HTMLInputElement).value,
    password: (loginForm.elements.namedItem("password") as HTMLInputElement)
      .value,
  };

  // La ubicación es opcional: si el usuario no la permite, seguimos sin ella
  try {
    const coords = await MyGeolocation.getLocation();
    loginData.lat = coords.latitude;
    loginData.lng = coords.longitude;
  } catch {
    // Sin ubicación
  }

  try {
    await authService.login(loginData);
    location.assign("index.html");
  } catch (error) {
    const message = (error as { error?: string }).error ?? "Could not log in";
    alert(message);
  }
});
