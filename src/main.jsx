import ReactDOM from "react-dom/client";
import App from "./app/App";
import PwaUpdatePrompt from "./components/ui/PwaUpdatePrompt.jsx";
import { initWebVitals } from "./lib/webVitals.js";
import "./styles/global.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <>
    <App />
    <PwaUpdatePrompt />
  </>
);

initWebVitals();
