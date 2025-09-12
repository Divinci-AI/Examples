import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../globals/auth";

const TEST_USERS = [
  { name: "Alice Johnson", username: "alice", password: "password123" },
  { name: "Bob Smith", username: "bob", password: "secret456" },
  { name: "Charlie Brown", username: "charlie", password: "test789" },
];

function Login(){
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e)=>{
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login({ username, password });
      navigate("/protected"); // Redirect to protected page after login
    }catch(err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const fillTestUser = (testUsername, testPassword)=>{
    setUsername(testUsername);
    setPassword(testPassword);
  };

  return (
    <div className="page">
      <h1>Login</h1>
      <p>Please log in to access the protected chat features.</p>

      <form onSubmit={handleSubmit} className="form">
        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

        <div className="form-group">
          <label htmlFor="username" className="form-label">
            Username
          </label>
          <input
            type="text"
            id="username"
            className="form-input"
            value={username}
            onChange={(e)=>setUsername(e.target.value)}
            required
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="password" className="form-label">
            Password
          </label>
          <input
            type="password"
            id="password"
            className="form-input"
            value={password}
            onChange={(e)=>setPassword(e.target.value)}
            required
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: "100%" }}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </div>
      </form>

      <div style={{ marginTop: "2rem", padding: "1rem", backgroundColor: "#f8f9fa", borderRadius: "4px" }}>
        <h3>Test Users</h3>
        <p>Click to fill the form with test credentials:</p>
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", justifyContent: "space-evenly" }}>
          {TEST_USERS.map((user, index)=>(
            <div
              key={user.username}
              style={{
                padding: "1rem",
                background: "white",
                border: "1px solid #dee2e6",
                borderRadius: "4px",
                textAlign: "center",
              }}
            >
              <strong>{user.name}</strong><br />
              <code>{user.username} / {user.password}</code>
              <div>
                <button
                  key={index}
                  type="button"
                  className="btn btn-secondary"
                  onClick={()=>fillTestUser(user.username, user.password)}
                  disabled={loading}
                >
                  Login as {user.name}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


export default Login;
