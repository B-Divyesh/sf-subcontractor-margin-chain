import { createContext, useContext, useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { getAgencySession, type AgencySession } from "../api/client";

const AgencySessionContext = createContext<AgencySession | null>(null);

export function useAgencySession() {
  return useContext(AgencySessionContext);
}

export function RequireAgency() {
  const location = useLocation();
  const [session, setSession] = useState<AgencySession | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let active = true;
    setChecked(false);
    getAgencySession()
      .then((result) => {
        if (active) setSession(result);
      })
      .catch(() => {
        if (active) setSession({ active: false });
      })
      .finally(() => {
        if (active) setChecked(true);
      });
    return () => {
      active = false;
    };
  }, []);

  if (!checked) {
    return (
      <main id="main" className="app-main section-shell">
        <h1 tabIndex={-1}>Opening your agency workspace…</h1>
        <p>Checking this browser for a saved agency session.</p>
      </main>
    );
  }

  if (!session?.active) {
    return <Navigate to="/start" replace state={{ returnTo: location.pathname }} />;
  }

  return (
    <AgencySessionContext.Provider value={session}>
      <Outlet />
    </AgencySessionContext.Provider>
  );
}
