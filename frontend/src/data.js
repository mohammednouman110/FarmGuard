// Fallback treatment data for AgriGuard AI

export const fallbackTreatments = [
  {
    pest: "🐛 Aphids",
    organic: "Neem oil spray\n5ml per liter water\nSpray every 7 days",
    chemical: "Imidacloprid 17.8%\n0.5ml per liter\nApply once",
  },
  {
    pest: "🍄 Fungal Blight",
    organic: "Trichoderma paste\nApply on roots\nRepeat after rain",
    chemical: "Mancozeb 75%\n2g per liter\nEvery 10 days",
  },
];

// API Base URL - Using Vite proxy (empty string will proxy to backend)
export const API_BASE = "";

// Default user ID
export const DEFAULT_USER_ID = "rajan123";

export default fallbackTreatments;

