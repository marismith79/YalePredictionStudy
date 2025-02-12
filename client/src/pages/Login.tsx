// src/pages/Login.tsx
import React, { useState } from 'react';
import { useLocation } from "wouter";

const Login: React.FC = () => {
  const [prolificId, setProlificId] = useState("");
  const [error, setError] = useState("");
  const [, setLocation] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("http://localhost:3000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prolificId }),
      });
      const data = await response.json();
      if (response.ok) {
        // Save the token (in localStorage, for example)
        localStorage.setItem("token", data.token);
        // Redirect the user to the Chat page (or wherever)
        setLocation("/chat");
      } else {
        setError(data.error || "Login failed");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Login error");
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Home</h2>
      <form onSubmit={handleSubmit}>
        <label>
          Prolific ID:
          <input
            type="text"
            value={prolificId}
            onChange={e => setProlificId(e.target.value)}
            placeholder="Enter 10-digit ID"
          />
        </label>
        <button type="submit">Login</button>
      </form>
      { error && <p style={{ color: "red" }}>{error}</p> }
    </div>
  );
};

export default Login;
