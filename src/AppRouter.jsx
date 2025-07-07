import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import App from "./App";
import TemplatesPage from "./components/TemplatesPage";
import TemplateEditor from "./components/TemplateEditor";

const AppRouter = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/templates" replace />} />
        <Route path="/templates" element={<TemplatesPage />} />
        <Route path="/template-editor/:templateId" element={<TemplateEditor />} />
        <Route path="/editor" element={<App />} />
      </Routes>
    </Router>
  );
};

export default AppRouter;