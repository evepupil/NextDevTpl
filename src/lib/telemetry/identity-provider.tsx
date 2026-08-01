"use client";

import { useEffect } from "react";

import { initializeTelemetryIdentity } from "./identity";

export function TelemetryIdentityProvider() {
  useEffect(() => {
    initializeTelemetryIdentity();
  }, []);

  return null;
}
