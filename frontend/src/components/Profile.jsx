// Profile Component for AgriGuard AI

import React, { useState } from "react";
import styles from "../styles";
import { API_BASE } from "../data";

function Profile({ t, user, onLogout }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState(null);
  const [saving, setSaving] = useState(false);
  
  // Get stored token
  const token = localStorage.getItem("authToken");
  
  // Default user data if not provided
  const userData = user || {
    name: "Guest User",
    phone: "",
    location: "Not set",
    farm_size: "Not set",
    crops: [],
    language: "en",
  };

  const handleEdit = () => {
    setEditedUser({ ...userData });
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!token) return;
    
    setSaving(true);
    try {
      const response = await fetch(`${API_BASE}/api/v1/auth/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(editedUser),
      });
      
      if (response.ok) {
        const updatedUser = await response.json();
        // Update localStorage
        localStorage.setItem("userData", JSON.stringify(updatedUser));
        // Reload page to refresh
        window.location.reload();
      } else {
        alert("Failed to update profile");
      }
    } catch (e) {
      console.error("Failed to update profile", e);
      alert("Failed to update profile");
    } finally {
      setSaving(false);
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedUser(null);
  };

  return (
    <>
      <h3>{t.profileTitle || "My Farm"}</h3>
      
      {/* Profile Card */}
      <div style={{
        ...styles.card,
        textAlign: "center",
        padding: 20,
      }}>
        <div style={{
          width: 80,
          height: 80,
          borderRadius: "50%",
          background: "#2d6a4f",
          color: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 36,
          margin: "0 auto 15px",
        }}>
          👨‍🌾
        </div>
        <h2 style={{ margin: "0 0 5px" }}>{userData.name || "Farmer"}</h2>
        <p style={{ margin: 0, color: "#6b7280", fontSize: 14 }}>
          {userData.phone ? `📱 ${userData.phone}` : "No phone number"}
        </p>
      </div>

      {/* User Details */}
      <div style={styles.card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h4 style={{ margin: 0 }}>Farm Details</h4>
          {!isEditing && (
            <button
              onClick={handleEdit}
              style={{
                background: "#2d6a4f",
                color: "white",
                border: "none",
                borderRadius: 8,
                padding: "6px 12px",
                fontSize: 12,
                cursor: "pointer",
              }}
            >
              ✏️ Edit
            </button>
          )}
        </div>
        
        {isEditing ? (
          // Edit Mode
          <>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 13, color: "#6b7280" }}>Name</label>
              <input
                type="text"
                value={editedUser?.name || ""}
                onChange={(e) => setEditedUser({ ...editedUser, name: e.target.value })}
                style={{ ...styles.input, marginBottom: 0 }}
              />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 13, color: "#6b7280" }}>Location</label>
              <input
                type="text"
                value={editedUser?.location || ""}
                onChange={(e) => setEditedUser({ ...editedUser, location: e.target.value })}
                style={{ ...styles.input, marginBottom: 0 }}
                placeholder="e.g., Maharashtra, India"
              />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 13, color: "#6b7280" }}>Farm Size</label>
              <input
                type="text"
                value={editedUser?.farm_size || ""}
                onChange={(e) => setEditedUser({ ...editedUser, farm_size: e.target.value })}
                style={{ ...styles.input, marginBottom: 0 }}
                placeholder="e.g., 5 acres"
              />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 13, color: "#6b7280" }}>Crops (comma separated)</label>
              <input
                type="text"
                value={editedUser?.crops || ""}
                onChange={(e) => setEditedUser({ ...editedUser, crops: e.target.value })}
                style={{ ...styles.input, marginBottom: 0 }}
                placeholder="e.g., Tomato, Cotton, Soybean"
              />
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  flex: 1,
                  padding: "12px",
                  borderRadius: 10,
                  border: "none",
                  background: "#16a34a",
                  color: "white",
                  fontWeight: "bold",
                  cursor: saving ? "not-allowed" : "pointer",
                }}
              >
                {saving ? "Saving..." : "💾 Save"}
              </button>
              <button
                onClick={handleCancel}
                style={{
                  flex: 1,
                  padding: "12px",
                  borderRadius: 10,
                  border: "1px solid #ddd",
                  background: "white",
                  color: "#666",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
            </div>
          </>
        ) : (
          // View Mode
          <>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ color: "#6b7280" }}>Location:</span>
              <span>{userData.location || "Not set"}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ color: "#6b7280" }}>Farm Size:</span>
              <span>{userData.farm_size || "Not set"}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ color: "#6b7280" }}>Member Since:</span>
              <span>{userData.created_at ? new Date(userData.created_at).toLocaleDateString() : "N/A"}</span>
            </div>
          </>
        )}
      </div>

      {/* Crops */}
      {userData.crops && !isEditing && (
        <div style={styles.card}>
          <h4 style={{ marginTop: 0 }}>My Crops</h4>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {(typeof userData.crops === 'string' 
              ? userData.crops.split(',').map(c => c.trim()) 
              : userData.crops || []
            ).map((crop, index) => (
              <span
                key={index}
                style={{
                  background: "#f0fdf4",
                  color: "#16a34a",
                  padding: "6px 12px",
                  borderRadius: 20,
                  fontSize: 13,
                }}
              >
                {crop}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Logout Button */}
      <div style={styles.card}>
        <button
          onClick={onLogout}
          style={{
            width: "100%",
            padding: "14px",
            borderRadius: 12,
            border: "1px solid #fee2e2",
            background: "#fef2f2",
            color: "#dc2626",
            fontSize: 15,
            fontWeight: "600",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          🚪 Logout
        </button>
      </div>

      {/* App Info */}
      <div style={styles.card}>
        <h4 style={{ marginTop: 0 }}>About</h4>
        <p style={{ margin: 0, fontSize: 13, color: "#6b7280" }}>
          AgriGuard AI - Crop Disease Detection App
        </p>
        <p style={{ margin: "5px 0 0", fontSize: 13, color: "#6b7280" }}>
          Version 1.0.0
        </p>
      </div>
    </>
  );
}

export default Profile;

