// Climate Component for AgriGuard AI - Farmer-Friendly Version
// Supports both manual input and automatic risk calculation

import React from "react";
import styles from "../styles";
import { API_BASE } from "../data";

function Climate({ t, climateData, setClimateData, climateResult, setClimateResult, checkingClimate, setCheckingClimate }) {
  const [iterations, setIterations] = React.useState(3);
  const [autoCheckLoading, setAutoCheckLoading] = React.useState(false);
  const [weatherData, setWeatherData] = React.useState(null);
  
  // Auto-check risk using weather API (no farmer input needed!)
  const runAutoCheck = async () => {
    setAutoCheckLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/climate/auto-check`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      if (res.ok) {
        const data = await res.json();
        // Update climate data with fetched weather
        setClimateData({
          temp: data.weather.temp,
          humidity: data.weather.humidity,
          rain: data.weather.rain,
          wind: data.weather.wind,
        });
        setWeatherData(data.weather);
        
        // Set result (wrap in array for compatibility)
        setClimateResult([data.risk]);
        
        // If alerts were generated, notify user
        if (data.alerts_generated > 0) {
          alert(`⚠️ ${data.alerts_generated} new alert(s) created! Check the Alerts tab.`);
        }
      }
    } catch (e) {
      console.error("Auto check failed", e);
    } finally {
      setAutoCheckLoading(false);
    }
  };
  
  const checkClimateRisk = async () => {
    setCheckingClimate(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/climate/check`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...climateData, iterations }),
      });
      if (res.ok) {
        const data = await res.json();
        setClimateResult(data);
      }
    } catch (e) {
      console.error("Climate check failed", e);
    } finally {
      setCheckingClimate(false);
    }
  };

  return (
    <>
      <h3>{t.climateTitle}</h3>
      
      {/* Description */}
      <div style={{ ...styles.card, background: "#f0f9ff", border: "1px solid #38bdf8" }}>
        <p style={{ margin: 0, fontSize: 14, color: "#0369a1", display: "flex", alignItems: "center", gap: 8 }}>
          💡 {t.climateDesc || "Enter current weather conditions to check pest outbreak risk for different temperature scenarios."}
        </p>
      </div>

      {/* Auto Check Button - No farmer input needed! */}
      <div style={styles.card}>
        <div style={{ textAlign: "center", padding: "10px 0" }}>
          <p style={{ fontSize: 14, color: "#666", marginBottom: 12 }}>
            🤖 Auto-check uses weather data - no manual input needed!
          </p>
          <button
            onClick={runAutoCheck}
            disabled={autoCheckLoading}
            style={{
              ...styles.bigBtn,
              background: autoCheckLoading ? "#9ca3af" : "linear-gradient(135deg, #6366f1, #8b5cf6)",
              color: "white",
              fontSize: 16,
              padding: 16,
              width: "100%",
            }}
          >
            {autoCheckLoading ? "⏳ Fetching Weather..." : "⚡ Auto Check Risk"}
          </button>
        </div>
        
        {/* Show fetched weather data if available */}
        {weatherData && (
          <div style={{ marginTop: 16, padding: 12, background: "#f0fdf4", borderRadius: 8, border: "1px solid #10b981" }}>
            <p style={{ margin: 0, fontSize: 13, color: "#10b981", fontWeight: "bold" }}>
              📍 Weather fetched: {weatherData.location}
            </p>
            <p style={{ margin: "4px 0 0", fontSize: 12, color: "#666" }}>
              🌡 {weatherData.temp}°C | 💧 {weatherData.humidity}% | 🌧 {weatherData.rain}mm | 🌬 {weatherData.wind} km/h
            </p>
          </div>
        )}
      </div>

      <div style={styles.card}>
        {/* Temperature */}
        <label style={{ fontSize: 14, fontWeight: "bold", display: "block", marginBottom: 8 }}>
          🌡 {t.temp || "Temperature"} (°C)
        </label>
        <input
          type="number"
          style={{ ...styles.input, fontSize: 18, textAlign: "center", padding: 16 }}
          value={climateData.temp}
          onChange={(e) => setClimateData({ ...climateData, temp: parseFloat(e.target.value) || 0 })}
        />
        
        {/* Humidity */}
        <label style={{ fontSize: 14, fontWeight: "bold", display: "block", marginBottom: 8, marginTop: 16 }}>
          💧 {t.humidity || "Humidity"} (%)
        </label>
        <input
          type="number"
          style={{ ...styles.input, fontSize: 18, textAlign: "center", padding: 16 }}
          value={climateData.humidity}
          onChange={(e) => setClimateData({ ...climateData, humidity: parseFloat(e.target.value) || 0 })}
        />
        
        {/* Rainfall */}
        <label style={{ fontSize: 14, fontWeight: "bold", display: "block", marginBottom: 8, marginTop: 16 }}>
          🌧 {t.rain || "Rainfall"} (mm)
        </label>
        <input
          type="number"
          style={{ ...styles.input, fontSize: 18, textAlign: "center", padding: 16 }}
          value={climateData.rain}
          onChange={(e) => setClimateData({ ...climateData, rain: parseFloat(e.target.value) || 0 })}
        />
        
        {/* Wind */}
        <label style={{ fontSize: 14, fontWeight: "bold", display: "block", marginBottom: 8, marginTop: 16 }}>
          🌬 {t.wind || "Wind"} (km/h)
        </label>
        <input
          type="number"
          style={{ ...styles.input, fontSize: 18, textAlign: "center", padding: 16 }}
          value={climateData.wind}
          onChange={(e) => setClimateData({ ...climateData, wind: parseFloat(e.target.value) || 0 })}
        />
        
        {/* Iterations */}
        <label style={{ fontSize: 14, fontWeight: "bold", display: "block", marginBottom: 8, marginTop: 16 }}>
          🔄 {t.scenarios || "Number of Temperature Scenarios"}
        </label>
        <input
          type="number"
          min="1"
          max="10"
          style={{ ...styles.input, fontSize: 18, textAlign: "center", padding: 16 }}
          value={iterations}
          onChange={(e) => setIterations(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
        />
        <p style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
          Calculate risk for {iterations} different temperature scenarios (+2°C per scenario)
        </p>
        
        <button
          onClick={checkClimateRisk}
          disabled={checkingClimate}
          style={{
            ...styles.bigBtn,
            background: checkingClimate ? "#9ca3af" : "linear-gradient(135deg, #f59e0b, #fbbf24)",
            color: "white",
            fontSize: 16,
            padding: 18,
            marginTop: 24,
          }}
        >
          {checkingClimate ? "⏳ Checking..." : `🔍 ${t.checkRisk}`}
        </button>
      </div>

      {/* Results */}
      {climateResult && climateResult.length > 0 && (
        <div style={styles.card}>
          <h4 style={{ marginTop: 0, marginBottom: 16, textAlign: "center" }}>
            📊 {t.riskResults || "Risk Assessment Results"}
          </h4>
          
          {climateResult.map((result, index) => (
            <div 
              key={index} 
              style={{ 
                marginBottom: index < climateResult.length - 1 ? 16 : 0,
                padding: 16, 
                borderRadius: 12, 
                background: result.level === "low" ? "#f0fdf4" : result.level === "medium" ? "#fffbeb" : result.level === "high" ? "#fef2f2" : "#fef2f2",
                border: `1px solid ${result.level === "low" ? "#10b981" : result.level === "medium" ? "#f59e0b" : "#ef4444"}`
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 28 }}>{result.emoji}</span>
                  <span style={{ 
                    fontWeight: "bold", 
                    fontSize: 16,
                    color: result.level === "low" ? "#10b981" : result.level === "medium" ? "#f59e0b" : "#ef4444"
                  }}>
                    {result.label}
                  </span>
                </div>
                <span style={styles.pill(
                  "white", 
                  result.level === "low" ? "#10b981" : result.level === "medium" ? "#f59e0b" : "#ef4444"
                )}>
                  {result.level.toUpperCase()} ({result.probability}%)
                </span>
              </div>
              
              <div style={{ fontSize: 14, color: "#666", marginBottom: 8 }}>
                <strong>🌡 Temperature Scenario:</strong> {result.temp_scenario}°C
              </div>
              
              <h5 style={{ marginBottom: 8, fontSize: 14 }}>📋 {t.measures}:</h5>
              <ul style={{ paddingLeft: 20, margin: 0 }}>
                {result.measures?.map((measure, i) => (
                  <li key={i} style={{ fontSize: 13, marginBottom: 6, lineHeight: 1.4 }}>{measure}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

export default Climate;

