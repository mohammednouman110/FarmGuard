// Header Component for AgriGuard AI - Farmer-Friendly Version

import React, { useState, useEffect } from "react";
import styles from "../styles";

const languages = [
  { code: "en", name: "English", flag: "🇬🇧" },
  { code: "hi", name: "हिंदी", flag: "🇮🇳" },
  { code: "ta", name: "தமிழ்", flag: "🇮🇳" },
  { code: "te", name: "తెలుగు", flag: "🇮🇳" },
  { code: "mr", name: "मराठी", flag: "🇮🇳" },
  { code: "es", name: "Español", flag: "🇪🇸" },
];

function Header({ t, tab, lang, setLang, currentUser, onLogout, onShowLogin }) {
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const currentLang = languages.find((l) => l.code === lang) || languages[0];

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <div style={styles.header}>
      {/* Title Row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={styles.headerTitle}>🌾 AgriGuard</span>
          
          {/* Online/Offline Status Indicator */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              padding: "4px 8px",
              borderRadius: 12,
              background: isOnline ? "rgba(22, 163, 74, 0.15)" : "rgba(239, 68, 68, 0.15)",
              fontSize: 11,
              color: isOnline ? "#16a34a" : "#dc2626",
            }}
          >
            <span style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: isOnline ? "#16a34a" : "#dc2626",
            }} />
            <span>{isOnline ? "Online" : "Offline"}</span>
          </div>
        </div>
        
        {/* Right side - Language + User */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* User Badge (if logged in) */}
          {currentUser ? (
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                style={styles.userBadge}
              >
                <span>👤</span>
                <span>{currentUser.name || "User"}</span>
              </button>
              
              {/* User Dropdown Menu */}
              {showUserMenu && (
                <div
                  style={{
                    position: "absolute",
                    top: "100%",
                    right: 0,
                    background: "white",
                    borderRadius: 12,
                    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                    marginTop: 8,
                    zIndex: 100,
                    minWidth: 150,
                    overflow: "hidden",
                  }}
                >
                  <button
                    onClick={() => {
                      // Go to profile tab
                      window.location.hash = "#profile";
                      setShowUserMenu(false);
                    }}
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      border: "none",
                      background: "white",
                      color: "#333",
                      fontSize: 14,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      textAlign: "left",
                    }}
                  >
                    <span>👤</span>
                    <span>My Profile</span>
                  </button>
                  <button
                    onClick={() => {
                      onLogout();
                      setShowUserMenu(false);
                    }}
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      border: "none",
                      background: "#fee2e2",
                      color: "#dc2626",
                      fontSize: 14,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      textAlign: "left",
                    }}
                  >
                    <span>🚪</span>
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={onShowLogin}
              style={{
                background: "rgba(255,255,255,0.2)",
                color: "white",
                border: "none",
                borderRadius: 12,
                padding: "8px 14px",
                fontSize: 14,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <span>🔓</span>
              <span>Login</span>
            </button>
          )}
          
          {/* Language Selector */}
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setShowLangMenu(!showLangMenu)}
              style={styles.langBtn}
            >
              <span>{currentLang.flag}</span>
              <span>{currentLang.name}</span>
              <span>▼</span>
            </button>
            
            {/* Language Dropdown */}
            {showLangMenu && (
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  right: 0,
                  background: "white",
                  borderRadius: 12,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                  marginTop: 8,
                  zIndex: 100,
                  minWidth: 150,
                  overflow: "hidden",
                }}
              >
                {languages.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => {
                      setLang(l.code);
                      setShowLangMenu(false);
                    }}
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      border: "none",
                      background: l.code === lang ? "#f0fdf4" : "white",
                      color: "#333",
                      fontSize: 14,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      textAlign: "left",
                    }}
                  >
                    <span>{l.flag}</span>
                    <span>{l.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Alert Strip on Home */}
      {tab === 0 && (
        <div style={{ marginTop: 12 }}>
          <div
            style={{
              background: "rgba(255,255,255,0.12)",
              padding: 10,
              borderRadius: 10,
              fontSize: 13,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span>⚠️</span>
            <span>{t.alert_strip}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default Header;

