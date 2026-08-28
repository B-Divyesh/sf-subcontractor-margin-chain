import { plannedRoutes } from "./route-manifest";

export function App() {
  return (
    <main className="scaffold" id="main">
      <p className="scaffold__eyebrow">Planning scaffold · no product behavior yet</p>
      <h1>Subcontractor Margin Chain</h1>
      <p>
        The design tokens, route contract, test runner, and backend shell are ready
        for the M1 builder.
      </p>
      <h2>Planned M1 routes</h2>
      <ul>
        {plannedRoutes
          .filter((route) => route.milestone === "M1")
          .map((route) => (
            <li key={route.path}>
              <code>{route.path}</code> — {route.purpose}
            </li>
          ))}
      </ul>
    </main>
  );
}

