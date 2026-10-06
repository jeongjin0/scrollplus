import { createRoot } from "react-dom/client";
import { OptionsApp } from "../../ui/options";
import "../../ui/app.css";

const root = document.querySelector("#root");
if (root) createRoot(root).render(<OptionsApp />);
