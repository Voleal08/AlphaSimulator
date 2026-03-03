import React from "react";
import { Navigate, useParams } from "react-router-dom";

export default function ChatView() {
  const { caseId } = useParams();
  return <Navigate to={`/cases/${caseId}`} replace />;
}