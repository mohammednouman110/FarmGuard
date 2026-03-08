// Home Component for AgriGuard AI - Farmer-Friendly Version

import React, { useState, useEffect } from "react";
import styles from "../styles";
import { API_BASE } from "../data";

function Home({ t, setTab }) {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardStep, setOnboardStep] = useState(0);
  const [autoRisk, setAutoRisk] = useState(null);
  const [loadingAutoRisk, setLoadingAutoRisk] = useState(false);
  
  const onboardingSteps = [
    { icon: "📸", title: t.onb1Title, desc: t.onb1Desc },
    { icon: "🌡", title: t.onb2Title, desc: t.onb2Desc },
    { icon: "💬", title: t.onb3Title, desc: t.onb3Desc },
  ];
  
  // Check if first time user
  React.useEffect(() => {
    const hasVisited = localStorage.getItem("agriVisited");
    if (!hasVisited) {
      setShowOnboarding(true);
    }
  }, []);
  
  const handleGetStarted = () => {
    localStorage.setItem("agriVisited", "true");
    setShowOnboarding(false);
  };
  
  const skipOnboarding = () => {
    localStorage.setItem("agriVisited", "true");
    setShowOnboarding(false);
  };

  // Auto-fetch risk on component mount (no farmer interaction!)
  React.useEffect(() => {
    const fetchAutoRisk = async () => {
      setLoadingAutoRisk(true);
      try {
        const res = await fetch(`${API_BASE}/api/v1/climate/auto-check`);
        if (res.ok) {
          const data = await res.json();
          setAutoRisk(data.risk);
        }
      } catch (e) {
        console.log("Auto risk check skipped");
      } finally {
        setLoadingAutoRisk(false);
      }
    };
    
    // Only fetch if not showing onboarding
    if (!showOnboarding) {
      fetchAutoRisk();
    }
  }, [showOnboarding]);

  // Onboarding Modal
  if (showOnboarding) {
    return (
      <div style={{ padding: 16 }}>
        <div style={styles.onboardingCard}>
          <div style={{ fontSize: 60, marginBottom: 16 }}>
            {onboardingSteps[onboardStep].icon}
          </div>
          <h2 style={styles.onboardingTitle}>
            {onboardingSteps[onboardStep].title}
          </h2>
          <p style={styles.onboardingDesc}>
            {onboardingSteps[onboardStep].desc}
          </p>
          
          {/* Step Indicators */}
          <div style={styles.stepIndicator}>
            {onboardingSteps.map((_, i) => (
              <div
                key={i}
                style={styles.stepDot(i === onboardStep, i < onboardStep)}
              />
            ))}
          </div>
          
          {/* Navigation Buttons */}
          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            {onboardStep < onboardingSteps.length - 1 ? (
              <>
                <button
                  onClick={skipOnboarding}
                  style={{
                    padding: "12px 24px",
                    borderRadius: 12,
                    border: "1px solid #ccc",
                    background: "white",
                    cursor: "pointer",
                    fontSize: 14,
                  }}
                >
                  {t.skip}
                </button>
                <button
                  onClick={() => setOnboardStep(s => s + 1)}
                  style={{
                    ...styles.bigBtn,
                    background: "#16a34a",
                    color: "white",
                    padding: "12px 32px",
                    width: "auto",
                  }}
                >
                  {t.next} →
                </button>
              </>
            ) : (
              <button
                onClick={handleGetStarted}
                style={{
                  ...styles.bigBtn,
                  background: "linear-gradient(135deg, #16a34a, #22c55e)",
                  color: "white",
                  padding: "14px 40px",
                  width: "auto",
                  fontSize: 16,
                }}
              >
                {t.getStarted} 🚀
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Auto-Calculated Risk Card - Shows automatically calculated risk! */}
      {autoRisk && !loadingAutoRisk && (
        <div 
          style={{ 
            ...styles.card, 
            background: autoRisk.level === "low" ? "#f0fdf4" : autoRisk.level === "medium" ? "#fffbeb" : "#fef2f2",
            border: `2px solid ${autoRisk.level === "low" ? "#10b981" : autoRisk.level === "medium" ? "#f59e0b" : "#ef4444"}`,
            cursor: "pointer"
          }}
          onClick={() => setTab(2)}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 36 }}>{autoRisk.emoji}</span>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, color: "#333" }}>
                  🤖 Auto Risk Check
                </h3>
                <p style={{ margin: "4px 0 0", fontSize: 13, color: "#666" }}>
                  Based on current weather
                </p>
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <span style={{ 
                fontSize: 24, 
                fontWeight: "bold",
                color: autoRisk.level === "low" ? "#10b981" : autoRisk.level === "medium" ? "#f59e0b" : "#ef4444"
              }}>
                {autoRisk.probability}%
              </span>
              <p style={{ margin: "4px 0 0", fontSize: 12, color: "#666" }}>
                {autoRisk.level.toUpperCase()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Loading state for auto risk */}
      {loadingAutoRisk && (
        <div style={{ ...styles.card, textAlign: "center", padding: 20 }}>
          <p style={{ margin: 0, color: "#666" }}>🤖 Checking risk automatically...</p>
        </div>
      )}

      {/* Welcome Card with Weather */}
      <div style={styles.weatherCard}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 18 }}>{t.greeting}</h2>
            <p style={{ margin: "4px 0 0", opacity: 0.9 }}>{t.subtitle}</p>
          </div>
          <div style={styles.weatherTemp}>28°</div>
        </div>
        <div style={styles.weatherInfo}>
          <span>💧 72%</span>
          <span>🌬 12 km/h</span>
          <span>☀️ Sunny</span>
        </div>
      </div>

      {/* Alert Banner */}
      <div style={styles.alertBanner} onClick={() => setTab(4)}>
        <span style={{ fontSize: 24 }}>⚠️</span>
        <div style={{ flex: 1 }}>
          <strong>{t.alert_strip}</strong>
        </div>
        <span style={{ fontSize: 18 }}>→</span>
      </div>

      {/* Big Scan Button */}
      <button
        style={styles.scanBtn}
        onClick={() => setTab(1)}
      >
        📸 {t.quickScan}
      </button>

      {/* Quick Action Grid */}
      <div style={styles.quickActions}>
        <button
          style={styles.quickActionBtn}
          onClick={() => setTab(2)}
        >
          <span style={styles.quickActionIcon}>🌡</span>
          <span style={styles.quickActionText}>{t.quickWeather}</span>
        </button>
        
        <button
          style={styles.quickActionBtn}
          onClick={() => setTab(3)}
        >
          <span style={styles.quickActionIcon}>💬</span>
          <span style={styles.quickActionText}>{t.quickChat}</span>
        </button>
        
        <button
          style={styles.quickActionBtn}
          onClick={() => setTab(4)}
        >
          <span style={styles.quickActionIcon}>🔔</span>
          <span style={styles.quickActionText}>{t.quickAlerts}</span>
        </button>
        
        <button
          style={styles.quickActionBtn}
          onClick={() => setTab(5)}
        >
          <span style={styles.quickActionIcon}>📊</span>
          <span style={styles.quickActionText}>Stats</span>
        </button>
      </div>

      {/* Help Card */}
      <div style={styles.card}>
        <h3 style={{ marginTop: 0, display: "flex", alignItems: "center", gap: 8 }}>
          📞 {t.helpline}
        </h3>
        <p style={{ fontSize: 13, color: "#666", margin: 0 }}>
          Need help? Call our free farmer helpline for instant support in your language!
        </p>
      </div>
    </>
  );
}

export default Home;

