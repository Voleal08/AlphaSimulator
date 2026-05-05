import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAppStore } from "./store/AppStore";

import Landing from "./pages/Landing";
import Events from "./pages/Events";
import EventView from "./pages/EventView";
import CaseView from "./pages/CaseView";
import ChatView from "./pages/ChatView";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Leaderboard from "./pages/Leaderboard";
import Notifications from "./pages/Notifications";
import Analytics from "./pages/Analytics";
import NotFound from "./pages/NotFound";
import Progress from "./pages/Progress";

import AdminCases from "./pages/admin/AdminCases";
import AdminAttempts from "./pages/admin/AdminAttempts";
import AdminAttemptView from "./pages/admin/AdminAttemptView";
import AdminUserView from "./pages/admin/AdminUserView";
import AdminUsers from "./pages/admin/AdminUsers";

function RequireAuth({ children }) {
  const { user } = useAppStore();
  return user ? children : <Navigate to="/auth?mode=login" replace />;
}

function RequireManager({ children }) {
  const { user, isManager } = useAppStore();
  if (!user) return <Navigate to="/auth?mode=login" replace />;
  if (!isManager()) return <Navigate to="/" replace />;
  return children;
}

function RequireParticipant({ children }) {
  const { user, isManager } = useAppStore();
  if (!user) return <Navigate to="/auth?mode=login" replace />;
  if (isManager()) return <Navigate to="/admin/attempts" replace />;
  if (user.role !== "participant") return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />

        <Route path="/events" element={<Events />} />
        <Route path="/events/:eventId" element={<EventView />} />

        <Route
          path="/cases/:caseId"
          element={
            <RequireAuth>
              <CaseView />
            </RequireAuth>
          }
        />

        <Route
          path="/cases/:caseId/chat"
          element={
            <RequireAuth>
              <ChatView />
            </RequireAuth>
          }
        />

        <Route path="/auth" element={<Auth />} />

        <Route
          path="/my-cases"
          element={
            <RequireParticipant>
              <Dashboard />
            </RequireParticipant>
          }
        />

        <Route
          path="/progress"
          element={
            <RequireParticipant>
              <Progress />
            </RequireParticipant>
          }
        />

        <Route
          path="/profile"
          element={
            <RequireAuth>
              <Profile />
            </RequireAuth>
          }
        />

        <Route path="/leaderboard" element={<Leaderboard />} />

        <Route
          path="/notifications"
          element={
            <RequireManager>
              <Notifications />
            </RequireManager>
          }
        />

        <Route
          path="/analytics"
          element={
            <RequireManager>
              <Analytics />
            </RequireManager>
          }
        />

        <Route
          path="/admin/attempts"
          element={
            <RequireManager>
              <AdminAttempts />
            </RequireManager>
          }
        />

        <Route
          path="/admin/attempts/:attemptId"
          element={
            <RequireManager>
              <AdminAttemptView />
            </RequireManager>
          }
        />

        <Route
          path="/admin/users"
          element={
            <RequireManager>
              <AdminUsers />
            </RequireManager>
          }
        />

        <Route
          path="/admin/users/:userId"
          element={
            <RequireManager>
              <AdminUserView />
            </RequireManager>
          }
        />

        <Route
          path="/admin/cases"
          element={
            <RequireManager>
              <AdminCases />
            </RequireManager>
          }
        />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}