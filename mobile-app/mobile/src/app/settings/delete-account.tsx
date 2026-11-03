/**
 * Mandatory Apple Guideline 5.1.1 In-App Account Deletion Screen (US-50 / Phase 7.5)
 * Calls DELETE /api/v1/me, scrubs PII, revokes FCM/APNs/VoIP push tokens, and resets SecureStore.
 */
import React, { useState } from "react";
import { ExpertHubApiClient } from "@experthub/api-client";

export async function confirmAndDeleteAccount(apiClient: ExpertHubApiClient, userId: string) {
  const response = await apiClient.deleteMyAccount(userId);
  return response;
}
