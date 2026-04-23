import React from "react";
import Signup from "./components/Signup";
import Login from "./components/Login";
import Home from "./components/Home";
import Expense from "./components/Expense";
import Profile from "./components/Profile";
import Analytics from "./components/Analytics";
import { Routes, Route, Navigate } from "react-router-dom";
import Loading from "./components/Loading";
import { useAuth } from "./components/useAuth";
import OAuthCallback from "./components/OAuthCallback";

function ProtectedRoute({ user, children }) {
  return user ? children : <Navigate to="/login" replace />;
}

function PublicRoute({ user, children }) {
  return user ? <Navigate to="/expenses" replace /> : children;
}

function App() {
  const { user, loading, logout } = useAuth();

  if (loading) {
    return <Loading message="Loading..." />;
  }

  return (
    <Routes>
      <Route path="/" element={<Home user={user} onLogout={logout} />} />

      <Route
        path="/signup"
        element={
          <PublicRoute user={user}>
            <Signup />
          </PublicRoute>
        }
      />
      <Route
        path="/login"
        element={
          <PublicRoute user={user}>
            <Login />
          </PublicRoute>
        }
      />

      <Route path="/auth/callback" element={<OAuthCallback />} />

      <Route
        path="/expenses"
        element={
          <ProtectedRoute user={user}>
            <Expense user={user} onLogout={logout} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute user={user}>
            <Profile user={user} onLogout={logout} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/analytics"
        element={
          <ProtectedRoute user={user}>
            <Analytics user={user} onLogout={logout} />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
