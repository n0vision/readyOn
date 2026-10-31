import { generatePatchnoteBanner } from "../apps/server/src/services/patchnotes/banner.js";

async function main() {
  console.log("Generating banner...");
  const res = await generatePatchnoteBanner();
  console.log("Banner successfully generated:", res);
}

main().catch((err) => {
  console.error("Error generating banner:", err);
  process.exit(1);
});
