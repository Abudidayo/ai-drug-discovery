import type { RouteObject } from "react-router";
import { EvaluationPage } from "./routes/EvaluationPage";
import { ExperimentLayout } from "./routes/ExperimentLayout";
import { LandingPage } from "./routes/LandingPage";
import { NotFoundPage } from "./routes/NotFoundPage";
import { RouteErrorPage } from "./routes/RouteErrorPage";
import { StepFigure } from "./routes/StepFigure";

export const routes: RouteObject[] = [
  {
    errorElement: <RouteErrorPage />,
    children: [
      { index: true, element: <LandingPage /> },
      {
        // The layout loads the Experiment and holds the persistent network; the step adds panels.
        path: "e/:experimentId",
        element: <ExperimentLayout />,
        children: [{ path: ":step", element: <StepFigure /> }],
      },
      { path: "evaluation", element: <EvaluationPage /> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
];
