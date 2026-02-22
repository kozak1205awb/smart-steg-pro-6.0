// web/src/App.tsx
import React from "react";
import { RouterProvider } from "react-router-dom";
import { router } from "./routes";
import { AppUserProvider } from "./appUser";

export default function App() {
  return (
    <AppUserProvider>
      <RouterProvider router={router} />
    </AppUserProvider>
  );
}