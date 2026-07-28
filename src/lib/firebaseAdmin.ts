import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

// Server-only. FIREBASE_SERVICE_ACCOUNT_KEY is the project's service-account
// JSON, base64-encoded into a single env var (Console → Project Settings →
// Service Accounts → Generate new private key → base64 the downloaded file).
// Lazy init so `next build` never crashes when the var isn't set yet.
let app: App | null = null;

function getAdminApp(): App {
  if (app) return app;
  const existing = getApps();
  if (existing.length > 0) {
    app = existing[0];
    return app;
  }

  const encoded = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!encoded) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY is not set");
  }
  const serviceAccount = JSON.parse(Buffer.from(encoded, "base64").toString("utf8"));
  app = initializeApp({ credential: cert(serviceAccount) });
  return app;
}

// Project's only Firestore database is the named "leads" instance (Enterprise
// edition, eur3) — not "(default)".
export function getLeadsDb(): Firestore {
  return getFirestore(getAdminApp(), "leads");
}
