// frontend/src/pages/Login.js
import React, { useState } from "react";
import { login, getCurrentUser } from "../services/api";
import { useNavigate } from "react-router-dom";
import { TextField, Button, IconButton, InputAdornment } from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import "../pages/auth.css";

function Login({ setUser }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      await login(email, password);
      const userData = await getCurrentUser();
      setUser(userData);
      navigate("/dashboard");
    } catch (error) {
      setError("Invalid username or password");
      console.error("Login error:", error);
    }
  };

  const handleSignup = function () {
    navigate("/register");
  };

  return (
    <div className="auth-container">
      <div className="auth-wrapper login-wrapper">
        <div className="floating-shapes">
          <div className="shape shape-1"></div>
          <div className="shape shape-2"></div>
          <div className="shape shape-3"></div>
          <div className="shape shape-4"></div>
        </div>
        
        <div className="auth-card">
          <div className="auth-header">
            <div className="logo-badge">
              <span>AITS</span>
            </div>
            <h1>Welcome Back!</h1>
            <p>Log in to your Academic Issue Tracking System account</p>
          </div>
          
          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <TextField
                id="email"
                type="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                fullWidth
                variant="outlined"
                placeholder="example@email.com"
                className="auth-input"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <TextField
                id="password"
                type={showPassword ? "text" : "password"}
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                fullWidth
                variant="outlined"
                placeholder="Enter your password"
                className="auth-input"
                required
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        className="password-toggle"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </div>
            
            <div className="form-options">
              <div className="remember-me">
                <input type="checkbox" id="remember" />
                <label htmlFor="remember">Remember me</label>
              </div>
              <a href="#" className="forgot-password">Forgot password?</a>
            </div>
            
            {error && <div className="error-message">{error}</div>}
            
            <Button
              type="submit"
              variant="contained"
              fullWidth
              className="auth-button"
            >
              Log In
            </Button>
            
            <div className="auth-divider">
              <span>New to AITS?</span>
            </div>
            
            <Button
              variant="outlined"
              fullWidth
              className="auth-button secondary-button"
              onClick={handleSignup}
            >
              Create an Account
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;
