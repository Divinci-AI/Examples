import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../globals/auth";

function Header(){
  const { user, logout } =  useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const location = useLocation();

  const isActive = (path)=>location.pathname === path;

  const toggleDropdown = ()=>{
    setDropdownOpen(!dropdownOpen);
  };

  const closeDropdown = ()=>{
    setDropdownOpen(false);
  };

  const handleLogout = ()=>{
    logout();
    closeDropdown();
  };

  return (
    <header className="header">
      <nav className="nav">
        <Link to="/" className="nav-brand">
          SPA Demo
        </Link>

        <ul className="nav-links">
          <li>
            <Link
              to="/"
              className={isActive("/") ? "active" : ""}
            >
              Home
            </Link>
          </li>
          <li>
            <Link
              to="/example"
              className={isActive("/example") ? "active" : ""}
            >
              Example
            </Link>
          </li>
          {user && (
            <li>
              <Link
                to="/protected"
                className={isActive("/protected") ? "active" : ""}
              >
                Protected
              </Link>
            </li>
          )}

          <li>
            {user ? (
              <div className="dropdown">
                <button
                  className="dropdown-toggle"
                  onClick={toggleDropdown}
                  onBlur={()=>setTimeout(closeDropdown, 150)}
                >
                  <img
                    src={user.picture}
                    alt={user.name}
                    className="user-avatar"
                  />
                  <span>{user.name}</span>
                  <span>▼</span>
                </button>

                <div className={`dropdown-menu ${dropdownOpen ? "" : "hidden"}`}>
                  <div className="dropdown-item">
                    <strong>{user.name}</strong>
                    <br />
                    <small>@{user.username}</small>
                  </div>
                  <hr style={{ margin: "0.5rem 0", border: "none", borderTop: "1px solid #dee2e6" }} />
                  <Link
                    to="/protected"
                    className="dropdown-item"
                    onClick={closeDropdown}
                  >
                    Protected Page
                  </Link>
                  <button
                    className="dropdown-item"
                    onClick={handleLogout}
                  >
                    Logout
                  </button>
                </div>
              </div>
            ) : (
              <Link
                to="/login"
                className={`btn btn-primary ${isActive("/login") ? "active" : ""}`}
              >
                Login
              </Link>
            )}
          </li>
        </ul>
      </nav>
    </header>
  );
}

export default Header;
