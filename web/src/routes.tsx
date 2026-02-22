import React from "react";
import { createBrowserRouter } from "react-router-dom";

import Shell from "./ui/Shell";
import RequireRole from "./ui/RequireRole";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Warehouse from "./pages/Warehouse";
import Profiles from "./pages/Profiles";
import StegCatalog from "./pages/StegCatalog";
import Reports from "./pages/Reports";
import AiCenter from "./pages/AiCenter";
import Admin from "./pages/Admin";

const wrap = (el: React.ReactNode) => <Shell>{el}</Shell>;

export const router = createBrowserRouter([
  { path: "/login", element: <Login /> },

  { path: "/", element: wrap(<Dashboard />) },

  {
    path: "/warehouse",
    element: wrap(
      <RequireRole role="worker">
        <Warehouse />
      </RequireRole>
    ),
  },

  {
    path: "/profiles",
    element: wrap(
      <RequireRole role="planner">
        <Profiles />
      </RequireRole>
    ),
  },

  {
    path: "/steg",
    element: wrap(
      <RequireRole role="planner">
        <StegCatalog />
      </RequireRole>
    ),
  },

  {
    path: "/reports",
    element: wrap(
      <RequireRole role="manager">
        <Reports />
      </RequireRole>
    ),
  },

  {
    path: "/ai",
    element: wrap(
      <RequireRole role="planner">
        <AiCenter />
      </RequireRole>
    ),
  },

  {
    path: "/admin",
    element: wrap(
      <RequireRole role="admin">
        <Admin />
      </RequireRole>
    ),
  },
]);