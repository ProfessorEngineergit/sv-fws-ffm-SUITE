// Google Drive sharing via a service account. No-ops (driveEnabled() === false)
// until GOOGLE_SERVICE_ACCOUNT_JSON is provided, so the platform runs without it.
import { readFileSync } from "node:fs";
import { google } from "googleapis";

type ServiceAccount = { client_email: string; private_key: string } & Record<string, unknown>;

function getServiceAccount(): ServiceAccount | null {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!raw) return null;
  try {
    const json = raw.trim().startsWith("{") ? raw : readFileSync(raw, "utf8");
    return JSON.parse(json) as ServiceAccount;
  } catch {
    return null;
  }
}

export function driveEnabled(): boolean {
  return getServiceAccount() !== null;
}

function driveClient() {
  const sa = getServiceAccount();
  if (!sa) return null;
  const auth = new google.auth.GoogleAuth({
    credentials: sa,
    scopes: ["https://www.googleapis.com/auth/drive"],
  });
  return google.drive({ version: "v3", auth });
}

/** Grant a Google account reader access to a Drive folder; Google emails them. */
export async function shareFolderWithUser(folderDriveId: string, email: string): Promise<void> {
  const drive = driveClient();
  if (!drive) throw new Error("Drive nicht konfiguriert");
  await drive.permissions.create({
    fileId: folderDriveId,
    sendNotificationEmail: true,
    requestBody: { type: "user", role: "reader", emailAddress: email },
  });
}
