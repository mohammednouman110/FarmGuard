// Dashboard Component for AgriGuard AI - Shows scan statistics with graphs

import React, { useState, useEffect } from "react";
import { API_BASE } from "../data";
import styles from "../styles";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";

function Dashboard({ t }) {
  const [stats, setStats] = useState({
    daily: 0,
    weekly: 0,
    monthly: 0,
    total: 0,
    disease_breakdown: {},
    recent_scans: [],
    daily_stats: []
  });
  const [loading, setLoading] = useState(true);
  const [chartType, setChartType] = useState("bar"); // bar, pie, line

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/detect/dashboard-stats`);
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (e) {
      console.error("Failed to load dashboard stats", e);
    } finally {
      setLoading(false);
    }
  };

  // Format disease name for display
  const formatDisease = (disease) => {
    if (!disease) return "Unknown";
    return disease.split("___").pop() || disease;
  };

  // Get color for disease
  const getDiseaseColor = (disease) => {
    const lower = disease?.toLowerCase() || "";
    if (lower.includes("healthy")) return "#16a34a";
    if (lower.includes("blight")) return "#dc2626";
    if (lower.includes("mold") || lower.includes("spot")) return "#f59e0b";
    if (lower.includes("mites") || lower.includes("aphid")) return "#8b5cf6";
    return "#2d6a4f";
  };

  // Prepare pie chart data
  const pieData = Object.entries(stats.disease_breakdown).map(([disease, count]) => ({
    name: formatDisease(disease),
    value: count,
    color: getDiseaseColor(disease)
  }));

  // Prepare bar chart data
  const barData = [
    { name: t.today || "Today", count: stats.daily, fill: "#16a34a" },
    { name: t.thisWeek || "Week", count: stats.weekly, fill: "#52b788" },
    { name: t.thisMonth || "Month", count: stats.monthly, fill: "#40916c" },
    { name: t.totalScans || "Total", count: stats.total, fill: "#1b4332" }
  ];

  // Prepare line chart data from daily_stats or recent_scans
  const lineData = stats.daily_stats?.length > 0 
    ? stats.daily_stats 
    : stats.recent_scans?.slice(0, 7).map((scan, idx) => ({
        name: scan.date || `Day ${idx + 1}`,
        count: 1
      })) || [];

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: 40 }}>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div>
      <h3>{t.dashboardTitle || "📊 Dashboard"}</h3>

      {/* Chart Type Selector */}
      <div style={{ 
        display: "flex", 
        gap: 8, 
        marginBottom: 16,
        justifyContent: "center"
      }}>
        <button
          onClick={() => setChartType("bar")}
          style={{
            padding: "8px 16px",
            borderRadius: 20,
            border: "none",
            background: chartType === "bar" ? "#16a34a" : "#e5e5e5",
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
            background: chartType === "pie" ? "#16a34a" : "#e5e5e5",
            color: chartType === "pie" ? "white" : "#333",
            cursor: "pointer",
            fontSize: 13
          }}
        >
          🥧 Pie
        </button>
        <button
          onClick={() => setChartType("line")}
          style={{
            padding: "8px 16px",
            borderRadius: 20,
            border: "none",
            background: chartType === "line" ? "#16a34a" : "#e5e5e5",
            color: chartType === "line" ? "white" : "#333",
            cursor: "pointer",
            fontSize: 13
          }}
        >
          📈 Line
        </button>
      </div>

      {/* Main Chart Area */}
      <div style={styles.card}>
        <h4 style={{ marginTop: 0, marginBottom: 16 }}>
          {t.scanStats || "Scan Statistics"}
        </h4>
        
        <div style={{ height: 250, width: "100%" }}>
          {chartType === "bar" && (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}
                />
                <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                  {barData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}

          {chartType === "pie" && pieData.length > 0 && (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}

          {chartType === "line" && (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}
                />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#16a34a" 
                  strokeWidth={3}
                  dot={{ fill: "#16a34a", strokeWidth: 2, r: 5 }}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(2, 1fr)", 
        gap: 12, 
        marginTop: 16 
      }}>
        <div style={{ ...styles.card, textAlign: "center", padding: 16 }}>
          <div style={{ fontSize: 28 }}>📅</div>
          <div style={{ fontSize: 24, fontWeight: "bold", color: "#16a34a" }}>{stats.daily}</div>
          <div style={{ fontSize: 12, color: "#666" }}>{t.today || "Today"}</div>
        </div>
        <div style={{ ...styles.card, textAlign: "center", padding: 16 }}>
          <div style={{ fontSize: 28 }}>📆</div>
          <div style={{ fontSize: 24, fontWeight: "bold", color: "#52b788" }}>{stats.weekly}</div>
          <div style={{ fontSize: 12, color: "#666" }}>{t.thisWeek || "This Week"}</div>
        </div>
        <div style={{ ...styles.card, textAlign: "center", padding: 16 }}>
          <div style={{ fontSize: 28 }}>🗓️</div>
          <div style={{ fontSize: 24, fontWeight: "bold", color: "#40916c" }}>{stats.monthly}</div>
          <div style={{ fontSize: 12, color: "#666" }}>{t.thisMonth || "This Month"}</div>
        </div>
        <div style={{ ...styles.card, textAlign: "center", padding: 16 }}>
          <div style={{ fontSize: 28 }}>📈</div>
          <div style={{ fontSize: 24, fontWeight: "bold", color: "#1b4332" }}>{stats.total}</div>
          <div style={{ fontSize: 12, color: "#666" }}>{t.totalScans || "Total"}</div>
        </div>
      </div>

      {/* Disease Breakdown */}
      {Object.keys(stats.disease_breakdown).length > 0 && (
        <div style={{ ...styles.card, marginTop: 16 }}>
          <h4 style={{ marginTop: 0, marginBottom: 12 }}>
            {t.diseaseBreakdown || "Disease Breakdown"}
          </h4>
          
          {Object.entries(stats.disease_breakdown).map(([disease, count], index) => (
            <div key={index} style={{
              display: "flex",
              alignItems: "center",
              marginBottom: 10
            }}>
              <div style={{
                width: 12,
                height: 12,
                borderRadius: "50%",
                backgroundColor: getDiseaseColor(disease),
                marginRight: 10
              }} />
              <span style={{ flex: 1, fontSize: 13 }}>{formatDisease(disease)}</span>
              <span style={{ 
                fontWeight: "bold",
                color: getDiseaseColor(disease)
              }}>{count}</span>
            </div>
          ))}
        </div>
      )}

      {/* Recent Scans */}
      {stats.recent_scans && stats.recent_scans.length > 0 && (
        <div style={{ ...styles.card, marginTop: 16 }}>
          <h4 style={{ marginTop: 0, marginBottom: 12 }}>
            {t.recentScans || "Recent Scans"}
          </h4>
          
          {stats.recent_scans.slice(0, 5).map((scan, index) => (
            <div key={index} style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "8px 0",
              borderBottom: index < 4 ? "1px solid #eee" : "none"
            }}>
              <div>
                <span style={{ fontSize: 13, fontWeight: 500 }}>{scan.disease}</span>
                <br />
                <small style={{ color: "#999" }}>{scan.date}</small>
              </div>
              <span style={styles.pill("#16a34a", "#f0fdf4")}>
                {scan.confidence}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {stats.total === 0 && (
        <div style={styles.card}>
          <p style={{ margin: 0, textAlign: "center", color: "#666" }}>
            {t.noScansYet || "No scans yet. Start scanning your crops from the Scan tab!"}
          </p>
        </div>
      )}
    </div>
  );
}

export default Dashboard;

