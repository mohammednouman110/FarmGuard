// Login Component for AgriGuard AI - Phone-based authentication

import React, { useState } from "react";
import styles from "../styles";
import { API_BASE } from "../data";

function Login({ t, onLoginSuccess, onClose }) {
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const endpoint = isRegistering ? "/api/v1/auth/register" : "/api/v1/auth/login";
      
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone: phone.trim(),
          name: isRegistering ? name.trim() : null
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Authentication failed");
      }

      // Store token and user info
      localStorage.setItem("authToken", data.access_token);
      localStorage.setItem("userData", JSON.stringify(data.user));
      
      // Call the success callback
      onLoginSuccess(data.user, data.access_token);
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatPhoneNumber = (value) => {
    // Remove any non-digit characters
    const digits = value.replace(/\D/g, "");
    
    // Limit to 10 digits for Indian numbers
    return digits.slice(0, 10);
  };

  const handlePhoneChange = (e) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhone(formatted);
  };

  return (
    <div style={styles.loginOverlay}>
      <div style={styles.loginCard}>
        {/* Header */}
        <div style={styles.loginHeader}>
          <span style={styles.loginLogo}>🌾</span>
          <h2 style={styles.loginTitle}>AgriGuard AI</h2>
          <p style={styles.loginSubtitle}>
            {isRegistering ? "Create your account" : "Welcome back!"}
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div style={styles.loginError}>
            ⚠️ {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* Phone Input */}
          <div style={styles.formGroup}>
            <label style={styles.formLabel}>📱 Phone Number</label>
            <input
              type="tel"
              value={phone}
              onChange={handlePhoneChange}
              placeholder="Enter 10-digit mobile number"
              style={styles.formInput}
              required
              maxLength={10}
            />
            <small style={styles.formHint}>
              Example: 9876543210
            </small>
          </div>

          {/* Name Input (only for registration) */}
          {isRegistering && (
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>👤 Your Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                style={styles.formInput}
                required={isRegistering}
              />
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            style={loading ? styles.loginButtonDisabled : styles.loginButton}
            disabled={loading}
          >
            {loading ? "⏳ Please wait..." : isRegistering ? "📝 Register" : "🔓 Login"}
          </button>

          {/* Toggle Register/Login */}
          <div style={styles.loginToggle}>
            {isRegistering ? (
              <p>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setIsRegistering(false);
                    setError("");
                  }}
                  style={styles.linkButton}
                >
                  Login
                </button>
              </p>
            ) : (
              <p>
                New user?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setIsRegistering(true);
                    setError("");
                  }}
                  style={styles.linkButton}
                >
                  Register
                </button>
              </p>
            )}
          </div>
        </form>

        {/* Skip for now */}
        <button
          type="button"
          onClick={onClose}
          style={styles.skipButton}
        >
          Skip for now →
        </button>
      </div>
    </div>
  );
}

export default Login;

