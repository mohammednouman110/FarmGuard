// Alerts Component for AgriGuard AI

import React from "react";
import styles from "../styles";
import { API_BASE } from "../data";

function Alerts({ t, alerts, setAlerts, loadingAlerts }) {
  const dismissAlert = async (alertId) => {
    try {
      await fetch(`${API_BASE}/api/v1/alerts/dismiss/${alertId}`, {
        method: "POST",
      });
      setAlerts(alerts.map(a => 
        a.id === alertId ? { ...a, is_active: false } : a
      ));
    } catch (e) {
      console.error("Failed to dismiss alert", e);
    }
  };

  return (
    <>
      <h3>{t.alertsTitle}</h3>
      {loadingAlerts && (
        <div style={styles.card}>
          <p>Loading alerts...</p>
        </div>
      )}
      {!loadingAlerts && alerts.length === 0 && (
        <div style={styles.card}>
          <p style={{ margin: 0, fontSize: 13 }}>{t.noAlerts}</p>
        </div>
      )}
      {alerts.map((alert) => (
        <div
          key={alert.id}
          style={{
            ...styles.card,
            borderLeft: `4px solid ${
              alert.type === "critical" ? "#ef4444" : alert.type === "warning" ? "#f59e0b" : "#3b82f6"
            }`,
            opacity: alert.is_active === false ? 0.6 : 1,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span
              style={styles.pill(
                "white",
                alert.type === "critical" ? "#ef4444" : alert.type === "warning" ? "#f59e0b" : "#3b82f6"
              )}
            >
              {alert.type?.toUpperCase()}
            </span>
            <small style={{ color: "#6b7280" }}>
              {new Date(alert.created_at).toLocaleDateString()}
            </small>
          </div>
          <h4 style={{ margin: "8px 0" }}>{alert.title}</h4>
          <p style={{ margin: 0, fontSize: 12, color: "#4b5563" }}>
            📍 {alert.field}
          </p>
          <p
            style={{
              margin: "8px 0 0",
              fontSize: 13,
              background: "#fef3c7",
              padding: 8,
              borderRadius: 6,
            }}
          >
            💡 {alert.action}
          </p>
          {alert.is_active !== false && (
            <button
              onClick={() => dismissAlert(alert.id)}
              style={{
                background: "none",
                border: "1px solid #6b7280",
                color: "#6b7280",
                padding: "6px 10px",
                borderRadius: 6,
                cursor: "pointer",
                fontSize: 12,
                marginTop: 10,
              }}
            >
              {t.dismiss}
            </button>
          )}
        </div>
      ))}
    </>
  );
}

export default Alerts;

