// Yield Prediction Component for AgriGuard AI
// Shows crop yield prediction based on environmental factors

import React, { useState, useEffect } from "react";
import { API_BASE } from "../data";
import styles from "../styles";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  PieChart, Pie, Cell
} from "recharts";

function Yield({ t }) {
  const [yieldData, setYieldData] = useState({
    crop_type: "rice",
    rainfall: 1200,
    temperature: 25,
    humidity: 70,
    soil_type: "loamy",
    fertilizer_usage: 100,
    pest_risk_score: 30,
    farm_area: 2,
  });
  
  const [predictionResult, setPredictionResult] = useState(null);
  const [predicting, setPredicting] = useState(false);
  const [chartType, setChartType] = useState("radar"); // radar, bar, pie

  // Available options
  const cropOptions = [
    "rice", "wheat", "corn", "tomato", "potato", "onion", "cotton", 
    "soybean", "sugarcane", "paddy", "pepper", "chilli", "brinjal", 
    "okra", "cabbage", "cauliflower", "carrot", "mango", "banana", 
    "apple", "grape", "orange"
  ];
  
  const soilOptions = ["loamy", "clay", "sandy", "silty", "peaty", "chalky", "black", "red"];

  const predictYield = async () => {
    setPredicting(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/yield/predict-yield`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(yieldData),
      });
      if (res.ok) {
        const data = await res.json();
        setPredictionResult(data);
      }
    } catch (e) {
      console.error("Yield prediction failed", e);
    } finally {
      setPredicting(false);
    }
  };

  // Prepare radar chart data
  const getRadarData = () => {
    if (!predictionResult?.yield_factors) return [];
    const factors = predictionResult.yield_factors;
    return [
      { factor: "Soil", value: factors.soil_quality || 0 },
      { factor: "Temperature", value: factors.temperature || 0 },
      { factor: "Humidity", value: factors.humidity || 0 },
      { factor: "Water", value: factors.water_availability || 0 },
      { factor: "Nutrients", value: factors.nutrient_supply || 0 },
      { factor: "Pest Control", value: factors.pest_resistance || 0 },
    ];
  };

  // Prepare bar chart data
  const getBarData = () => {
    if (!predictionResult?.yield_factors) return [];
    const factors = predictionResult.yield_factors;
    return [
      { name: "Soil Quality", value: factors.soil_quality || 0, fill: "#8b5cf6" },
      { name: "Temperature", value: factors.temperature || 0, fill: "#f59e0b" },
      { name: "Humidity", value: factors.humidity || 0, fill: "#06b6d4" },
      { name: "Water", value: factors.water_availability || 0, fill: "#3b82f6" },
      { name: "Nutrients", value: factors.nutrient_supply || 0, fill: "#10b981" },
      { name: "Pest Control", value: factors.pest_resistance || 0, fill: "#ef4444" },
    ];
  };

  // Prepare pie chart data
  const getPieData = () => {
    if (!predictionResult?.yield_factors) return [];
    const factors = predictionResult.yield_factors;
    const colors = ["#8b5cf6", "#f59e0b", "#06b6d4", "#3b82f6", "#10b981", "#ef4444"];
    return Object.entries(factors).map(([key, value], index) => ({
      name: key.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()),
      value: value,
      color: colors[index % colors.length]
    }));
  };

  return (
    <>
      <h3>🌾 {t.yieldTitle || "Yield Prediction"}</h3>
      
      {/* Description */}
      <div style={{ ...styles.card, background: "#f0fdf4", border: "1px solid #10b981", marginBottom: 16 }}>
        <p style={{ margin: 0, fontSize: 14, color: "#047857", display: "flex", alignItems: "center", gap: 8 }}>
          💡 Enter your field conditions to predict crop yield and get improvement recommendations.
        </p>
      </div>

      {/* Input Form */}
      <div style={styles.card}>
        <h4 style={{ marginTop: 0, marginBottom: 16 }}>📋 Field Information</h4>
        
        {/* Crop Type */}
        <label style={{ fontSize: 14, fontWeight: "bold", display: "block", marginBottom: 8 }}>
          🌱 Crop Type
        </label>
        <select
          style={{ ...styles.input, marginBottom: 12 }}
          value={yieldData.crop_type}
          onChange={(e) => setYieldData({ ...yieldData, crop_type: e.target.value })}
        >
          {cropOptions.map(crop => (
            <option key={crop} value={crop}>
              {crop.charAt(0).toUpperCase() + crop.slice(1)}
            </option>
          ))}
        </select>
        
        {/* Soil Type */}
        <label style={{ fontSize: 14, fontWeight: "bold", display: "block", marginBottom: 8 }}>
          🌍 Soil Type
        </label>
        <select
          style={{ ...styles.input, marginBottom: 12 }}
          value={yieldData.soil_type}
          onChange={(e) => setYieldData({ ...yieldData, soil_type: e.target.value })}
        >
          {soilOptions.map(soil => (
            <option key={soil} value={soil}>
              {soil.charAt(0).toUpperCase() + soil.slice(1)}
            </option>
          ))}
        </select>

        {/* Farm Area */}
        <label style={{ fontSize: 14, fontWeight: "bold", display: "block", marginBottom: 8 }}>
          📐 Farm Area (hectares)
        </label>
        <input
          type="number"
          step="0.1"
          style={{ ...styles.input, marginBottom: 12 }}
          value={yieldData.farm_area}
          onChange={(e) => setYieldData({ ...yieldData, farm_area: parseFloat(e.target.value) || 0 })}
        />

        {/* Temperature */}
        <label style={{ fontSize: 14, fontWeight: "bold", display: "block", marginBottom: 8 }}>
          🌡 Temperature (°C)
        </label>
        <input
          type="number"
          style={{ ...styles.input, marginBottom: 12 }}
          value={yieldData.temperature}
          onChange={(e) => setYieldData({ ...yieldData, temperature: parseFloat(e.target.value) || 0 })}
        />

        {/* Humidity */}
        <label style={{ fontSize: 14, fontWeight: "bold", display: "block", marginBottom: 8 }}>
          💧 Humidity (%)
        </label>
        <input
          type="number"
          style={{ ...styles.input, marginBottom: 12 }}
          value={yieldData.humidity}
          onChange={(e) => setYieldData({ ...yieldData, humidity: parseFloat(e.target.value) || 0 })}
        />

        {/* Rainfall */}
        <label style={{ fontSize: 14, fontWeight: "bold", display: "block", marginBottom: 8 }}>
          🌧 Annual Rainfall (mm)
        </label>
        <input
          type="number"
          style={{ ...styles.input, marginBottom: 12 }}
          value={yieldData.rainfall}
          onChange={(e) => setYieldData({ ...yieldData, rainfall: parseFloat(e.target.value) || 0 })}
        />

        {/* Fertilizer Usage */}
        <label style={{ fontSize: 14, fontWeight: "bold", display: "block", marginBottom: 8 }}>
          🧪 Fertilizer Usage (kg/ha)
        </label>
        <input
          type="number"
          style={{ ...styles.input, marginBottom: 12 }}
          value={yieldData.fertilizer_usage}
          onChange={(e) => setYieldData({ ...yieldData, fertilizer_usage: parseFloat(e.target.value) || 0 })}
        />

        {/* Pest Risk Score */}
        <label style={{ fontSize: 14, fontWeight: "bold", display: "block", marginBottom: 8 }}>
          🐛 Pest Risk Score (0-100)
        </label>
        <input
          type="range"
          min="0"
          max="100"
          style={{ width: "100%", marginBottom: 8 }}
          value={yieldData.pest_risk_score}
          onChange={(e) => setYieldData({ ...yieldData, pest_risk_score: parseFloat(e.target.value) || 0 })}
        />
        <div style={{ textAlign: "center", marginBottom: 16, fontSize: 14, color: "#666" }}>
          {yieldData.pest_risk_score}
        </div>

        <button
          onClick={predictYield}
          disabled={predicting}
          style={{
            ...styles.bigBtn,
            background: predicting ? "#9ca3af" : "linear-gradient(135deg, #10b981, #34d399)",
            color: "white",
            fontSize: 16,
            padding: 18,
          }}
        >
          {predicting ? "⏳ Predicting..." : "🌾 Predict Yield"}
        </button>
      </div>

      {/* Results */}
      {predictionResult && (
        <>
          {/* Main Result Card */}
          <div style={{ 
            ...styles.card, 
            marginTop: 16,
            background: predictionResult.risk_level === "low" ? "#f0fdf4" : 
                       predictionResult.risk_level === "medium" ? "#fffbeb" : "#fef2f2",
            border: `2px solid ${predictionResult.risk_color}`
          }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 48, marginBottom: 8 }}>{predictionResult.risk_emoji}</div>
              <div style={{ fontSize: 28, fontWeight: "bold", color: predictionResult.risk_color, marginBottom: 4 }}>
                {predictionResult.predicted_yield?.toLocaleString()} {predictionResult.predicted_yield_unit}
              </div>
              <div style={{ fontSize: 14, color: "#666", marginBottom: 8 }}>
                ({predictionResult.per_hectare_yield?.toLocaleString()} kg/hectare)
              </div>
              <div style={{ 
                display: "inline-block",
                padding: "4px 16px",
                borderRadius: 20,
                background: predictionResult.risk_color,
                color: "white",
                fontWeight: "bold",
                fontSize: 14
              }}>
                {predictionResult.risk_label}
              </div>
              <div style={{ fontSize: 12, color: "#666", marginTop: 8 }}>
                Confidence: {predictionResult.confidence}%
              </div>
            </div>
          </div>

          {/* Historical Comparison */}
          <div style={{ ...styles.card, marginTop: 16, textAlign: "center" }}>
            <span style={{ fontSize: 16 }}>📊 {predictionResult.historical_comparison}</span>
          </div>

          {/* Chart Type Selector */}
          <div style={{ display: "flex", gap: 8, marginTop: 16, justifyContent: "center" }}>
            <button
              onClick={() => setChartType("radar")}
              style={{
                padding: "8px 16px",
                borderRadius: 20,
                border: "none",
                background: chartType === "radar" ? "#10b981" : "#e5e5e5",
                color: chartType === "radar" ? "white" : "#333",
                cursor: "pointer",
                fontSize: 13
              }}
            >
              🕸 Radar
            </button>
            <button
              onClick={() => setChartType("bar")}
              style={{
                padding: "8px 16px",
                borderRadius: 20,
                border: "none",
                background: chartType === "bar" ? "#10b981" : "#e5e5e5",
                color: chartType === "bar" ? "white" : "#333",
                cursor: "pointer",
                fontSize: 13
              }}
            >
              📊 Bar
            </button>
            <button
              onClick={() => setChartType("pie")}
              style={{
                padding: "8px 16px",
                borderRadius: 20,
                border: "none",
                background: chartType === "pie" ? "#10b981" : "#e5e5e5",
                color: chartType === "pie" ? "white" : "#333",
                cursor: "pointer",
                fontSize: 13
              }}
            >
              🥧 Pie
            </button>
          </div>

          {/* Chart */}
          <div style={{ ...styles.card, marginTop: 16, height: 300 }}>
            <h4 style={{ marginTop: 0, marginBottom: 12, textAlign: "center" }}>
              Yield Factors Analysis
            </h4>
            
            {chartType === "radar" && (
              <ResponsiveContainer width="100%" height={220}>
                <RadarChart data={getRadarData()}>
                  <PolarGrid stroke="#e5e5e5" />
                  <PolarAngleAxis dataKey="factor" tick={{ fontSize: 11 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <Radar
                    name="Factor Score"
                    dataKey="value"
                    stroke="#10b981"
                    fill="#10b981"
                    fillOpacity={0.5}
                  />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            )}

            {chartType === "bar" && (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={getBarData()} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {getBarData().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}

            {chartType === "pie" && (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={getPieData()}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {getPieData().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Recommendations */}
          <div style={{ ...styles.card, marginTop: 16 }}>
            <h4 style={{ marginTop: 0, marginBottom: 12 }}>💡 Recommendations</h4>
            
            {predictionResult.recommendations?.map((rec, index) => (
              <div 
                key={index} 
                style={{ 
                  padding: "10px 12px", 
                  marginBottom: 8, 
                  borderRadius: 8, 
                  background: "#f9fafb",
                  display: "flex",
                  alignItems: "center",
                  gap: 8
                }}
              >
                <span>👉</span>
                <span style={{ fontSize: 13 }}>{rec}</span>
              </div>
            ))}
          </div>

          {/* Detailed Recommendations */}
          {predictionResult.detailed_recommendations?.length > 0 && (
            <div style={{ ...styles.card, marginTop: 16 }}>
              <h4 style={{ marginTop: 0, marginBottom: 12 }}>📋 Detailed Action Plan</h4>
              
              {predictionResult.detailed_recommendations.map((rec, index) => (
                <div 
                  key={index} 
                  style={{ 
                    padding: 12, 
                    marginBottom: 8, 
                    borderRadius: 8, 
                    background: rec.priority === "high" ? "#fef2f2" : 
                               rec.priority === "medium" ? "#fffbeb" : "#f0fdf4",
                    borderLeft: `4px solid ${
                      rec.priority === "high" ? "#ef4444" : 
                      rec.priority === "medium" ? "#f59e0b" : "#10b981"
                    }`
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <span style={{ fontWeight: "bold", fontSize: 13 }}>{rec.category}</span>
                    <span style={{ 
                      fontSize: 11, 
                      padding: "2px 8px", 
                      borderRadius: 10,
                      background: rec.priority === "high" ? "#ef4444" : 
                                 rec.priority === "medium" ? "#f59e0b" : "#10b981",
                      color: "white"
                    }}>
                      {rec.priority.toUpperCase()}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: 13, color: "#333" }}>{rec.recommendation}</p>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </>
  );
}

export default Yield;

