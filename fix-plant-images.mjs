import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import { WebSocket } from "ws";

globalThis.WebSocket = WebSocket;

const envContent = fs.readFileSync(".env", "utf-8");
const serviceKeyMatch = envContent.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/);
const SERVICE_KEY = serviceKeyMatch ? serviceKeyMatch[1].trim() : "";

if (!SERVICE_KEY) {
  console.error("SUPABASE_SERVICE_ROLE_KEY not found in .env");
  process.exit(1);
}

const SUPABASE_URL = "https://kjmgtctcwwqsrepoldor.supabase.co";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

function isPlaceholderOrEmpty(url) {
  if (!url || url.trim() === "") return true;
  const badPatterns = [
    "upgrade_access",
    "source.unsplash.com",
    "placehold",
    "photo-1466692476868",
  ];
  return badPatterns.some((p) => url.toLowerCase().includes(p));
}

async function verifyImageUrl(url) {
  if (!url || url.trim() === "") return false;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(url, {
      method: "HEAD",
      signal: controller.signal,
      redirect: "manual",
    });
    clearTimeout(timeout);
    // Accept 2xx and 3xx as valid (spec: 2xx good, 301/302 also valid)
    return res.status >= 200 && res.status < 400;
  } catch (err) {
    return false;
  }
}

async function getWikimediaCommonsImage(searchTerm) {
  try {
    const searchRes = await fetch(
      `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(searchTerm)}&srnamespace=6&srlimit=5&format=json&origin=*`
    );
    if (!searchRes.ok) return null;
    const searchData = await searchRes.json();
    const results = searchData.query?.search || [];

    for (const result of results) {
      const fileTitle = result.title;
      if (!fileTitle) continue;

      const imageRes = await fetch(
        `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(fileTitle)}&prop=imageinfo&iiprop=url|thumburl&iiurlwidth=400&format=json&origin=*`
      );
      if (!imageRes.ok) continue;
      const imageData = await imageRes.json();
      const pages = imageData.query?.pages;
      const page = pages ? Object.values(pages)[0] : null;
      if (page?.imageinfo?.[0]?.thumburl) {
        return page.imageinfo[0].thumburl;
      }
      if (page?.imageinfo?.[0]?.url) {
        return page.imageinfo[0].url;
      }
    }
    return null;
  } catch (err) {
    console.error("Wikimedia Commons error:", err.message);
    return null;
  }
}

async function main() {
  const { data: plants, error } = await supabase
    .from("plant_library")
    .select("id, species_name, common_name, image_url");

  if (error) {
    console.error("Failed to fetch plants:", error);
    process.exit(1);
  }

  console.log(`Found ${plants.length} plants`);

  let fixed = 0;
  let good = 0;
  let failed = 0;

  const brokenEntries = [];
  const reportLines = [];
  reportLines.push("# Image Fix Report");
  reportLines.push("");
  reportLines.push(`Date: ${new Date().toISOString()}`);
  reportLines.push(`Total plants checked: ${plants.length}`);
  reportLines.push("");

  for (let i = 0; i < plants.length; i++) {
    const plant = plants[i];
    const displayName = plant.species_name || plant.common_name || `ID:${plant.id}`;

    const needsFix =
      isPlaceholderOrEmpty(plant.image_url) || !(await verifyImageUrl(plant.image_url));

    if (!needsFix) {
      good++;
      console.log(`[${i + 1}/${plants.length}] OK: ${displayName}`);
      continue;
    }

    console.log(
      `[${i + 1}/${plants.length}] BROKEN: ${displayName} | old: ${plant.image_url || "(none)"}`
    );

    let image = null;
    if (plant.species_name) {
      image = await getWikimediaCommonsImage(plant.species_name + " plant");
    }
    if (!image && plant.common_name) {
      image = await getWikimediaCommonsImage(plant.common_name + " plant");
    }
    if (!image && plant.species_name) {
      const genus = plant.species_name.split(" ")[0];
      image = await getWikimediaCommonsImage(genus + " plant");
    }
    if (!image && plant.common_name) {
      image = await getWikimediaCommonsImage(plant.common_name);
    }
    if (!image && plant.species_name) {
      image = await getWikimediaCommonsImage(plant.species_name);
    }

    if (image) {
      const { error: updateError } = await supabase
        .from("plant_library")
        .update({ image_url: image })
        .eq("id", plant.id);

      if (updateError) {
        console.error(`[${i + 1}/${plants.length}] ERR: ${displayName} - ${updateError.message}`);
        brokenEntries.push({
          plant,
          oldUrl: plant.image_url,
          newUrl: null,
          status: `Update error: ${updateError.message}`,
        });
        failed++;
      } else {
        console.log(`[${i + 1}/${plants.length}] FIXED: ${displayName} -> ${image}`);
        brokenEntries.push({
          plant,
          oldUrl: plant.image_url,
          newUrl: image,
          status: "Fixed",
        });
        fixed++;
      }
    } else {
      console.log(`[${i + 1}/${plants.length}] MISS: ${displayName} (no commons image found)`);
      brokenEntries.push({
        plant,
        oldUrl: plant.image_url,
        newUrl: null,
        status: "No Wikimedia Commons image found",
      });
      failed++;
    }

    await new Promise((r) => setTimeout(r, 800));
  }

  reportLines.push("## Summary");
  reportLines.push(`- **Total plants**: ${plants.length}`);
  reportLines.push(`- **Already good**: ${good}`);
  reportLines.push(`- **Fixed**: ${fixed}`);
  reportLines.push(`- **Failed/Missed**: ${failed}`);
  reportLines.push("");

  if (brokenEntries.length > 0) {
    reportLines.push("## Broken URLs and Replacements");
    reportLines.push("");
    reportLines.push("| Plant | Old URL | New URL | Status |");
    reportLines.push("|-------|---------|---------|--------|");
    for (const entry of brokenEntries) {
      const name = entry.plant.species_name || entry.plant.common_name || `ID:${entry.plant.id}`;
      const oldUrl = entry.oldUrl || "(none)";
      const newUrl = entry.newUrl || "(none)";
      reportLines.push(`| ${name} | ${oldUrl} | ${newUrl} | ${entry.status} |`);
    }
    reportLines.push("");
  } else {
    reportLines.push("## Broken URLs and Replacements");
    reportLines.push("");
    reportLines.push("No broken URLs found.");
    reportLines.push("");
  }

  const reportPath = "/project/workspace/.kimchi/docs/image-fix-report.md";
  fs.writeFileSync(reportPath, reportLines.join("\n"), "utf-8");

  console.log(`\nDone: ${fixed} fixed, ${good} already good, ${failed} failed/missed`);
  console.log(`Report saved to ${reportPath}`);
}

main();
