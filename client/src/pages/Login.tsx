import React, { useState } from 'react';
import { useLocation } from "wouter";

const apiUrl = process.env.VITE_API_URL;

const Login: React.FC = () => {
  const [prolificId, setProlificId] = useState("");
  const [error, setError] = useState("");
  const [, setLocation] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`${apiUrl}/api/login`, {
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
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", flexDirection: "column" }}>
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
