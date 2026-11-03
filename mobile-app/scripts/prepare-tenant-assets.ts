/**
 * apps/mobile/scripts/prepare-tenant-assets.ts
 * Executed in CI/CD before `eas build --platform all --non-interactive --auto-submit`.
 * 1. Computes HMAC-SHA256 signature for TENANT_IDENT.
 * 2. Pulls signed tenant manifest from GET /api/v1/internal/mobile_build_config/:ident.
 * 3. Validates 1024x1024 PNG icon dimensions and ensures no alpha transparency channel (Apple App Store requirement).
 * 4. Writes .tenant-build/manifest.json, GoogleService-Info.plist, google-services.json, and store keys.
 */
import crypto from "crypto";
import fs from "fs";
import path from "path";

export function validatePng1024NoAlpha(pngBuffer: Buffer): { valid: boolean; width: number; height: number; colorType: number; reason?: string } {
  // PNG signature: 89 50 4E 47 0D 0A 1A 0A
  const PNG_SIG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  if (pngBuffer.length < 33 || !pngBuffer.subarray(0, 8).equals(PNG_SIG)) {
    return { valid: false, width: 0, height: 0, colorType: -1, reason: "Invalid PNG file header" };
  }
  const width = pngBuffer.readUInt32BE(16);
  const height = pngBuffer.readUInt32BE(20);
  const colorType = pngBuffer.readUInt8(25); // 2 = Truecolor RGB (no alpha), 6 = RGBA (has alpha)

  if (width !== 1024 || height !== 1024) {
    return { valid: false, width, height, colorType, reason: `Expected 1024x1024 dimensions, got ${width}x${height}` };
  }
  if (colorType === 4 || colorType === 6) {
    return { valid: false, width, height, colorType, reason: "Apple App Store rejects 1024x1024 icons with an alpha channel (colorType 4 or 6)" };
  }
  return { valid: true, width, height, colorType };
}

export async function prepareTenantBuildDir(tenantIdent: string, manifestPayload: Record<string, any>, outDir: string) {
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, "manifest.json"), JSON.stringify(manifestPayload, null, 2));

  if (manifestPayload.credentials?.googleServicesJson) {
    fs.writeFileSync(path.join(outDir, "google-services.json"), manifestPayload.credentials.googleServicesJson);
  }
  if (manifestPayload.credentials?.googleServicePlist) {
    fs.writeFileSync(path.join(outDir, "GoogleService-Info.plist"), manifestPayload.credentials.googleServicePlist);
  }
  if (manifestPayload.credentials?.appleAscP8Key) {
    fs.writeFileSync(path.join(outDir, "asc-api-key.p8"), manifestPayload.credentials.appleAscP8Key);
  }
  if (manifestPayload.credentials?.googlePlayJsonKey) {
    fs.writeFileSync(path.join(outDir, "google-play-service-account.json"), manifestPayload.credentials.googlePlayJsonKey);
  }
  return { manifestPath: path.join(outDir, "manifest.json"), tenantIdent };
}
