import { lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
const Landing = lazy(() => import("./Landing"));
const Staff = lazy(() => import("./StaffGate"));
const path = window.location.pathname.replace(/\/+$/, "") || "/";
createRoot(document.getElementById("root")!).render(
  <Suspense fallback={<p role="status">Loading Busy Brewing…</p>}>
    {path === "/" ? (
      <Landing />
    ) : path === "/staff" ? (
      <Staff />
    ) : (
      <main>
        <h1>Page not found</h1>
        <a href="/">Back to Busy Brewing</a>
      </main>
    )}
  </Suspense>,
);
