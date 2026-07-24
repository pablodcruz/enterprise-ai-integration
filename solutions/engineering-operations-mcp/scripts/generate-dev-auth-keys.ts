import { access, mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { exportPKCS8, exportSPKI, generateKeyPair } from "jose";

const outputDirectory = resolve(process.cwd(), ".local", "auth");
const privateKeyPath = resolve(outputDirectory, "private.pem");
const publicKeyPath = resolve(outputDirectory, "public.pem");

if ((await exists(privateKeyPath)) || (await exists(publicKeyPath))) {
  console.log("Development auth keys already exist; no files were overwritten.");
  console.log(`Public key: ${publicKeyPath}`);
  process.exit(0);
}

const { privateKey, publicKey } = await generateKeyPair("RS256", { extractable: true });
await mkdir(outputDirectory, { recursive: true });
await writeFile(privateKeyPath, await exportPKCS8(privateKey), { mode: 0o600 });
await writeFile(publicKeyPath, await exportSPKI(publicKey), { mode: 0o644 });

console.log("Generated local-only RS256 development keys.");
console.log(`Private key: ${privateKeyPath}`);
console.log(`Public key: ${publicKeyPath}`);

async function exists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}
