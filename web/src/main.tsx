import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";

import "./styles/app.css";
import { router } from "./routes";
import { AppUserProvider } from "./appUser";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AppUserProvider>
      <RouterProvider router={router} />
    </AppUserProvider>
  </React.StrictMode>
);