import { createRoot } from "react-dom/client";
import { PopupApp } from "../../ui/popup";
import "../../ui/app.css";

const root = document.querySelector("#root");
if (root) createRoot(root).render(<PopupApp />);
