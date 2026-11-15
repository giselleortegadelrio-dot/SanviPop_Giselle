import { resolve } from "path";
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        index: resolve(__dirname, "index.html"),
        login: resolve(__dirname, "login.html"),
        register: resolve(__dirname, "register.html"),
        addProduct: resolve(__dirname, "add-product.html"),
        productDetail: resolve(__dirname, "product-detail.html"),
        profile: resolve(__dirname, "profile.html"),
      },
    },
  },
});