// Main App Component for AgriGuard AI - Farmer-Friendly Version

import React, { useState, useEffect } from "react";
import { translations } from "./translations";
import { API_BASE, fallbackTreatments } from "./data";
import styles from "./styles";

// Components
import Header from "./components/Header";
import TabBar from "./components/TabBar";
import Home from "./components/Home";
import Scan from "./components/Scan";
import Climate from "./components/Climate";
import Yield from "./components/Yield";
import Chat from "./components/Chat";
import Alerts from "./components/Alerts";
import Dashboard from "./components/Dashboard";
import History from "./components/History";
import Profile from "./components/Profile";
import Login from "./components/Login";

function AgriGuardAI() {
  const [tab, setTab] = useState(0);
  const [lang, setLang] = useState("en");
  const [scanStep, setScanStep] = useState(0);
  const [scanResult, setScanResult] = useState(null);
  const [history, setHistory] = useState(() => {
    const saved = localStorage.getItem("agriHistory");
    return saved ? JSON.parse(saved) : [];
  });
  const [messages, setMessages] = useState([
    { from: "ai", text: "Namaste! 🌾 Ask me anything about your crops!" },
  ]);
  const [input, setInput] = useState("");
  const [uploading, setUploading] = useState(false);
  
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [authToken, setAuthToken] = useState(null);
  
  // User ID - now from authenticated user
  const [userId, setUserId] = useState(null);
  
  // Alerts state
  const [alerts, setAlerts] = useState([]);
  const [loadingAlerts, setLoadingAlerts] = useState(false);
  
  // Climate state
  const [climateData, setClimateData] = useState({
    temp: 28,
    humidity: 72,
    rain: 5,
    wind: 12,
  });
  const [climateResult, setClimateResult] = useState(null);
  const [checkingClimate, setCheckingClimate] = useState(false);

  const t = translations[lang] || translations.en;

  // Check for existing auth on mount
  useEffect(() => {
    const storedToken = localStorage.getItem("authToken");
    const storedUser = localStorage.getItem("userData");
    
    if (storedToken && storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setAuthToken(storedToken);
        setCurrentUser(user);
        setUserId(user.id);
        setIsAuthenticated(true);
      } catch (e) {
        // Invalid stored data, clear it
        localStorage.removeItem("authToken");
        localStorage.removeItem("userData");
      }
    } else {
      // Show login screen for new users
      setShowLogin(true);
    }
  }, []);

  // Handle successful login
  const handleLoginSuccess = (user, token) => {
    setAuthToken(token);
    setCurrentUser(user);
    setUserId(user.id);
    setIsAuthenticated(true);
    setShowLogin(false);
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("userData");
    setAuthToken(null);
    setCurrentUser(null);
    setUserId(null);
    setIsAuthenticated(false);
    setShowLogin(true);
  };

  // Get auth headers for API calls
  const getAuthHeaders = () => {
    const headers = {
      "Content-Type": "application/json",
    };
    if (authToken) {
      headers["Authorization"] = `Bearer ${authToken}`;
    }
    return headers;
  };

  // Fetch alerts on mount and when tab changes to alerts
  useEffect(() => {
    if (tab === 4 && isAuthenticated) {
      fetchAlerts();
    }
  }, [tab, isAuthenticated]);

  const fetchAlerts = async () => {
    setLoadingAlerts(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/alerts/`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setAlerts(data);
      }
    } catch (e) {
      console.error("Failed to load alerts", e);
    } finally {
      setLoadingAlerts(false);
    }
  };

  const dismissAlert = async (alertId) => {
    try {
      await fetch(`${API_BASE}/api/v1/alerts/dismiss/${alertId}`, {
        method: "POST",
        headers: getAuthHeaders(),
      });
      setAlerts(alerts.map(a => 
        a.id === alertId ? { ...a, is_active: false } : a
      ));
    } catch (e) {
      console.error("Failed to dismiss alert", e);
    }
  };

  // Sync history from backend on mount
  useEffect(() => {
    if (!isAuthenticated) return;
    
    const fetchHistory = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/v1/detect/history`, {
          headers: getAuthHeaders(),
        });
        if (!res.ok) return;
        const data = await res.json();
        // Normalize into frontend history format
        const normalized = data.map((item) => ({
          id: item.id,
          disease: item.prediction?.split("___")[-1] || item.disease || "Unknown",
          confidence: `${Math.round((item.confidence || 0) * 100)}%`,
          crop: item.crop || "Tomato",
          treatment: {
            organic: item.treatment_organic || fallbackTreatments[1].organic,
            chemical: item.treatment_chemical || fallbackTreatments[1].chemical,
          },
          date: new Date(item.created_at).toLocaleDateString(),
        }));
        setHistory(normalized);
        localStorage.setItem("agriHistory", JSON.stringify(normalized));
      } catch (e) {
        console.error("Failed to load history", e);
      }
    };
    fetchHistory();
  }, [isAuthenticated, authToken]);

  const saveToHistory = (res) => {
    const newEntry = {
      ...res,
      id: Date.now(),
      date: new Date().toLocaleDateString(),
    };
    const updated = [newEntry, ...history];
    setHistory(updated);
    localStorage.setItem("agriHistory", JSON.stringify(updated));
  };

  // Render content based on current tab
  const renderContent = () => {
    switch (tab) {
      case 0:
        return <Home t={t} setTab={setTab} />;
      case 1:
        return (
          <Scan 
            t={t} 
            scanStep={scanStep} 
            setScanStep={setScanStep}
            scanResult={scanResult}
            setScanResult={setScanResult}
            saveToHistory={saveToHistory}
            authToken={authToken}
          />
        );
      case 2:
        return (
          <Climate 
            t={t}
            climateData={climateData}
            setClimateData={setClimateData}
            climateResult={climateResult}
            setClimateResult={setClimateResult}
            checkingClimate={checkingClimate}
            setCheckingClimate={setCheckingClimate}
          />
        );
      case 3:
        return (
          <Chat 
            t={t}
            messages={messages}
            setMessages={setMessages}
            input={input}
            setInput={setInput}
            lang={lang}
          />
        );
      case 4:
        return (
          <Alerts 
            t={t}
            alerts={alerts}
            setAlerts={setAlerts}
            loadingAlerts={loadingAlerts}
          />
        );
      case 5:
        return (
          <History 
            t={t}
            history={history}
          />
        );
      case 6:
        return (
          <Yield 
            t={t}
          />
        );
      case 7:
        return (
          <Profile 
            t={t}
            user={currentUser}
            onLogout={handleLogout}
          />
        );
      default:
        return <Home t={t} setTab={setTab} />;
    }
  };

  // Show login screen if not authenticated
  if (showLogin && !isAuthenticated) {
    return (
      <Login 
        t={t}
        onLoginSuccess={handleLoginSuccess}
        onClose={() => setShowLogin(false)}
      />
    );
  }

  return (
    <div style={styles.app}>
      <Header 
        t={t} 
        tab={tab} 
        lang={lang} 
        setLang={setLang}
        currentUser={currentUser}
        onLogout={handleLogout}
        onShowLogin={() => setShowLogin(true)}
      />
      
      <div style={styles.content}>
        {renderContent()}
      </div>

      <TabBar t={t} tab={tab} setTab={setTab} />
    </div>
  );
}

export default AgriGuardAI;

