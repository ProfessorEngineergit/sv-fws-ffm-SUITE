// Idempotent seed: migrates the current Drive/Firestore data into PostgreSQL.
//   • protocols  ← data-import/data/index.json  (+ copies PDFs into UPLOADS_DIR)
//   • events     ← data-import/data/termine.txt (parsed via @sv/core)
//   • roles      ← DEFAULT_ROLES placeholders (fill in real people in /admin/rollen)
//   • folders    ← DriveFolder placeholders (paste real Drive IDs in /admin/zugang)
import {
  readFileSync,
  existsSync,
  mkdirSync,
  copyFileSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseTermineFile, DEFAULT_ROLES } from "@sv/core";
import { prisma } from "../src/index";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "../../..");
const dataImport = path.join(repoRoot, "data-import");

function resolveUploadsDir(): string {
  const raw = process.env.UPLOADS_DIR || "./data-uploads";
  return path.isAbsolute(raw) ? raw : path.resolve(repoRoot, raw);
}

interface DriveProtocol {
  title: string;
  date: string;
  slug: string;
  file: string;
  updatedAt: string;
}
interface Meta {
  md5Checksum?: string;
  driveId?: string;
  originalName?: string;
}

async function seedProtocols() {
  const indexPath = path.join(dataImport, "data", "index.json");
  if (!existsSync(indexPath)) {
    console.warn("  · no index.json — skipping protocols");
    return;
  }
  const items: DriveProtocol[] = JSON.parse(readFileSync(indexPath, "utf8"));
  const protoDir = path.join(resolveUploadsDir(), "protocols");
  mkdirSync(protoDir, { recursive: true });

  for (const it of items) {
    const baseName = path.basename(it.file);
    const srcPdf = path.join(dataImport, "downloads", baseName);

    let meta: Meta = {};
    const metaPath = `${srcPdf}.meta.json`;
    if (existsSync(metaPath)) {
      try {
        meta = JSON.parse(readFileSync(metaPath, "utf8"));
      } catch {
        /* ignore malformed meta */
      }
    }

    if (existsSync(srcPdf)) {
      copyFileSync(srcPdf, path.join(protoDir, baseName));
    } else {
      console.warn(`  · PDF missing for ${it.slug}: ${srcPdf}`);
    }

    await prisma.protocol.upsert({
      where: { slug: it.slug },
      update: {
        title: it.title,
        date: new Date(it.date),
        filePath: `protocols/${baseName}`,
        originalName: meta.originalName ?? null,
        md5Checksum: meta.md5Checksum ?? null,
        driveId: meta.driveId ?? null,
      },
      create: {
        slug: it.slug,
        title: it.title,
        date: new Date(it.date),
        status: "PUBLIC",
        filePath: `protocols/${baseName}`,
        originalName: meta.originalName ?? null,
        md5Checksum: meta.md5Checksum ?? null,
        driveId: meta.driveId ?? null,
      },
    });
    console.log(`  ✓ protocol ${it.slug}`);
  }
}

async function seedEvents() {
  const terminePath = path.join(dataImport, "data", "termine.txt");
  if (!existsSync(terminePath)) {
    console.warn("  · no termine.txt — skipping events");
    return;
  }
  const stunden = parseTermineFile(readFileSync(terminePath, "utf8"));
  let created = 0;
  for (const s of stunden) {
    const existing = await prisma.event.findFirst({
      where: { start: s.date, lessonSlot: s.fs, source: "TERMINE" },
    });
    if (existing) continue;
    await prisma.event.create({
      data: {
        title: `SV-Stunde (${s.fs})`,
        start: s.date,
        end: s.endDate,
        lessonSlot: s.fs,
        visibility: "PUBLIC",
        source: "TERMINE",
      },
    });
    created++;
  }
  console.log(`  ✓ events: ${created} created (${stunden.length} parsed)`);
}

async function seedRoles() {
  for (const r of DEFAULT_ROLES) {
    const exists = await prisma.roleAssignment.findFirst({ where: { role: r.role } });
    if (exists) continue;
    await prisma.roleAssignment.create({
      data: { role: r.role, name: r.name, order: r.order },
    });
  }
  console.log(`  ✓ roles: ${DEFAULT_ROLES.length} ensured`);
}

async function seedDriveFolders() {
  if ((await prisma.driveFolder.count()) > 0) return;
  await prisma.driveFolder.createMany({
    data: [
      {
        name: "Protokolle",
        driveId: "REPLACE_WITH_DRIVE_FOLDER_ID",
        description: "Alle SV-Protokolle als PDF.",
        isPublicRequestable: true,
      },
      {
        name: "Öffentliche Dokumente",
        driveId: "REPLACE_WITH_DRIVE_FOLDER_ID",
        description: "Für alle freigegebene SV-Dokumente.",
        isPublicRequestable: true,
      },
    ],
  });
  console.log("  ✓ drive folders seeded (set real driveId in /admin/zugang)");
}

async function main() {
  console.log("🌱 Seeding SV-Platform …");
  await seedProtocols();
  await seedEvents();
  await seedRoles();
  await seedDriveFolders();
  console.log("✅ Seed complete.");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
