import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AppFrame } from "../components/AppFrame";
import { ChainPage } from "../routes/ChainPage";
import { DemoPage } from "../routes/DemoPage";
import { LandingPage } from "../routes/LandingPage";
import { ImportPage } from "../routes/ImportPage";
import { NotFoundPage, PrivacyPage, TermsPage } from "../routes/LegalPages";
import { NewChainPage } from "../routes/NewChainPage";
import { StartPage } from "../routes/StartPage";
import { TeamPage } from "../routes/TeamPage";

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppFrame />}>
          <Route index element={<LandingPage />} />
          <Route path="demo" element={<DemoPage />} />
          <Route path="demo/import" element={<ImportPage />} />
          <Route path="demo/chains/new" element={<NewChainPage />} />
          <Route path="demo/chains/:chainId" element={<ChainPage />} />
          <Route path="start" element={<StartPage />} />
          <Route path="app/chains" element={<DemoPage />} />
          <Route path="app/chains/new" element={<NewChainPage />} />
          <Route path="app/chains/:chainId" element={<ChainPage />} />
          <Route path="settings/team" element={<TeamPage />} />
          <Route path="privacy" element={<PrivacyPage />} />
          <Route path="terms" element={<TermsPage />} />
          <Route path="404" element={<NotFoundPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
