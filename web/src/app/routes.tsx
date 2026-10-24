import type { RouteObject } from "react-router";
import { LandingPage } from "./routes/LandingPage";
import { NotFoundPage } from "./routes/NotFoundPage";
import { RouteErrorPage } from "./routes/RouteErrorPage";
import { StepPage } from "./routes/StepPage";

export const routes: RouteObject[] = [
  {
    errorElement: <RouteErrorPage />,
    children: [
      { index: true, element: <LandingPage /> },
      { path: "e/:experimentId/:step", element: <StepPage /> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
];
