// TabBar Component for AgriGuard AI - Farmer-Friendly Version

import React from "react";
import styles from "../styles";

function TabBar({ t, tab, setTab }) {
  // Simplified tabs for easier use - fewer options, larger targets
  const mainTabs = [
    { index: 0, icon: "🏠", label: "Home" },
    { index: 1, icon: "📸", label: "Scan" },
    { index: 2, icon: "🌡", label: "Weather" },
    { index: 6, icon: "🌾", label: "Yield" },
    { index: 3, icon: "💬", label: "Chat" },
    { index: 4, icon: "🔔", label: "Alerts" },
    { index: 5, icon: "📜", label: "History" },
  ];

  return (
    <div style={styles.tabBar}>
      {mainTabs.map((item) => (
        <button
          key={item.index}
          onClick={() => setTab(item.index)}
          style={styles.tabBtn(tab === item.index)}
        >
          <span style={styles.tabIcon}>{item.icon}</span>
          <span>{item.label}</span>
        </button>
      ))}
    </div>
  );
}

export default TabBar;

