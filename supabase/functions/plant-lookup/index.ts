import { createClient } from "jsr:@supabase/supabase-js@2";

function isBrokenOrPlaceholder(url: string | null): boolean {
  if (!url || url.trim() === "") return true;
  const bad = [
    "upgrade_access",
    "source.unsplash.com",
    "placehold",
    "placeholder",
    "no_image",
    "noimage",
    "missing_image",
  ];
  return bad.some((b) => url.toLowerCase().includes(b));
}

// Helper to check if an image URL is a placeholder
function isPlaceholderImage(url: string | null): boolean {
  if (!url) return true;
  return url.includes("upgrade_access.jpg") || url.includes("upgrade_access.png");
}

// Helper to strip "(group)" suffix from species names
function cleanSpeciesName(name: string): string {
  if (!name) return name;
  return name.replace(/\s*\(group\)/gi, "").trim();
}

type ToxicityLevel = "high" | "moderate" | "low" | "none";

interface ToxicityInfo {
  pets: ToxicityLevel;
  humans: boolean;
  symptoms: string;
  safe_placement: string;
}

const TOXICITY_MAP: Record<string, ToxicityInfo> = {
  // Scientific names
  "monstera deliciosa": { pets: "moderate", humans: true, symptoms: "Oral irritation, intense burning, drooling, vomiting, difficulty swallowing", safe_placement: "Keep on high shelves or hanging baskets out of reach of pets and children" },
  "epipremnum aureum": { pets: "moderate", humans: true, symptoms: "Oral irritation, burning, drooling, vomiting, difficulty swallowing", safe_placement: "Hanging baskets or high shelves; toxic to cats and dogs" },
  "sansevieria trifasciata": { pets: "moderate", humans: true, symptoms: "Nausea, vomiting, diarrhea if ingested; mild skin irritation", safe_placement: "Place where pets cannot chew leaves" },
  "aloe vera": { pets: "moderate", humans: true, symptoms: "Vomiting, diarrhea, tremors; skin irritation from sap in some people", safe_placement: "Keep away from pets who may chew; safe for topical human use" },
  "chlorophytum comosum": { pets: "low", humans: false, symptoms: "Mild gastrointestinal upset if large amounts eaten", safe_placement: "Generally safe; mild stomach upset possible if ingested by cats" },
  "spathiphyllum": { pets: "moderate", humans: true, symptoms: "Oral burning, drooling, vomiting, difficulty swallowing", safe_placement: "Keep away from pets and children; very popular but toxic" },
  "ficus elastica": { pets: "low", humans: true, symptoms: "Skin and eye irritation from milky sap; oral irritation if ingested", safe_placement: "Sap can irritate skin; place away from pets and children" },
  "ficus lyrata": { pets: "low", humans: true, symptoms: "Oral irritation, skin irritation from sap", safe_placement: "Sap irritates skin and mouth; keep away from pets" },
  "zamioculcas zamiifolia": { pets: "moderate", humans: true, symptoms: "Oral burning, swelling, vomiting; skin and eye irritation", safe_placement: "Highly toxic if ingested; keep well away from pets and children" },
  "philodendron": { pets: "moderate", humans: true, symptoms: "Oral burning, drooling, vomiting, difficulty swallowing", safe_placement: "Keep on high shelves or hanging planters" },
  "crassula ovata": { pets: "moderate", humans: true, symptoms: "Vomiting, lethargy, depression, incoordination in pets", safe_placement: "Toxic to cats and dogs; place out of reach" },
  "calathea": { pets: "none", humans: false, symptoms: "Non-toxic; no symptoms expected", safe_placement: "Pet-safe and child-safe; can be placed at any height" },
  "codiaeum variegatum": { pets: "moderate", humans: true, symptoms: "Oral irritation, vomiting, diarrhea; skin irritation from sap", safe_placement: "Sap is irritating; keep away from pets and children" },
  "dracaena": { pets: "moderate", humans: true, symptoms: "Vomiting, diarrhea, drooling, weakness in pets", safe_placement: "Toxic to cats and dogs; place out of reach" },
  "dracaena marginata": { pets: "moderate", humans: true, symptoms: "Vomiting, diarrhea, drooling, weakness in pets", safe_placement: "Toxic to cats and dogs; place out of reach" },
  "hedera helix": { pets: "high", humans: true, symptoms: "Severe gastrointestinal upset, drooling, vomiting, diarrhea, difficulty breathing in severe cases", safe_placement: "Highly toxic to pets; should be kept completely out of reach or avoided" },
  "chamaedorea elegans": { pets: "none", humans: false, symptoms: "Non-toxic; no symptoms expected", safe_placement: "Pet-safe; safe for any location in the home" },
  "aglaonema": { pets: "moderate", humans: true, symptoms: "Oral irritation, drooling, vomiting, difficulty swallowing", safe_placement: "Keep on tables or shelves away from pets" },
  "yucca": { pets: "moderate", humans: true, symptoms: "Vomiting, diarrhea, drooling if ingested", safe_placement: "Place away from pets and small children" },
  "begonia": { pets: "low", humans: true, symptoms: "Mild gastrointestinal upset from tubers; skin irritation from juice", safe_placement: "Avoid placement where pets dig in soil" },
  "phalaenopsis": { pets: "none", humans: false, symptoms: "Non-toxic; no symptoms expected", safe_placement: "Pet-safe; one of the safest flowering plants for homes with pets" },
  "nephrolepis exaltata": { pets: "none", humans: false, symptoms: "Non-toxic to cats and dogs; safe", safe_placement: "Pet-safe fern; can be placed anywhere" },
  "pachira aquatica": { pets: "none", humans: false, symptoms: "Non-toxic; no symptoms expected", safe_placement: "Pet-safe and child-safe" },
  "alocasia": { pets: "high", humans: true, symptoms: "Severe oral irritation, swelling, vomiting, difficulty breathing; highly toxic", safe_placement: "Extremely toxic if ingested; keep completely away from pets and children" },
  "anthurium": { pets: "moderate", humans: true, symptoms: "Oral irritation, burning, drooling, vomiting, difficulty swallowing", safe_placement: "Keep away from pets and children" },
  "strelitzia reginae": { pets: "low", humans: true, symptoms: "Mild gastrointestinal upset if seeds or flowers ingested", safe_placement: "Mildly toxic; keep seeds away from pets" },
  "strelitzia nicolai": { pets: "low", humans: true, symptoms: "Mild gastrointestinal upset if seeds or flowers ingested", safe_placement: "Mildly toxic; keep seeds away from pets" },
  "cactus": { pets: "low", humans: true, symptoms: "Physical spines are the main hazard; mild nausea if ingested", safe_placement: "Keep away from children and pets due to spines" },
  "eucalyptus": { pets: "moderate", humans: true, symptoms: "Vomiting, diarrhea, drooling, weakness if ingested", safe_placement: "Keep away from pets; eucalyptus oil is especially toxic" },
  "lavandula": { pets: "low", humans: false, symptoms: "Mild nausea in cats if large amounts consumed; generally safe", safe_placement: "Generally safe but concentrated oil can be toxic to cats" },
  // Missing species variants
  "corymbia citriodora": { pets: "moderate", humans: true, symptoms: "Vomiting, diarrhea, drooling, weakness if ingested", safe_placement: "Keep away from pets; eucalyptus oil is especially toxic" },
  "euphorbia trigona": { pets: "high", humans: true, symptoms: "Severe skin and eye irritation from milky sap; vomiting, diarrhea if ingested", safe_placement: "Highly toxic sap; keep completely away from pets and children" },
  "yucca filamentosa": { pets: "moderate", humans: true, symptoms: "Vomiting, diarrhea, drooling if ingested", safe_placement: "Place away from pets and small children" },
  "chlorophytum 'bonnie'": { pets: "low", humans: false, symptoms: "Mild gastrointestinal upset if large amounts eaten", safe_placement: "Generally safe; mild stomach upset possible" },
  "begonia 'art hodes'": { pets: "low", humans: true, symptoms: "Mild gastrointestinal upset from tubers; skin irritation from juice", safe_placement: "Avoid placement where pets dig in soil" },
  // Common name aliases
  "monstera": { pets: "moderate", humans: true, symptoms: "Oral irritation, intense burning, drooling, vomiting", safe_placement: "Keep on high shelves or hanging baskets" },
  "pothos": { pets: "moderate", humans: true, symptoms: "Oral irritation, burning, drooling, vomiting", safe_placement: "Hanging baskets or high shelves" },
  "golden pothos": { pets: "moderate", humans: true, symptoms: "Oral irritation, burning, drooling, vomiting", safe_placement: "Hanging baskets or high shelves" },
  "snake plant": { pets: "moderate", humans: true, symptoms: "Nausea, vomiting, diarrhea if ingested", safe_placement: "Place where pets cannot chew leaves" },
  "spider plant": { pets: "low", humans: false, symptoms: "Mild gastrointestinal upset if large amounts eaten", safe_placement: "Generally safe; mild stomach upset possible" },
  "peace lily": { pets: "moderate", humans: true, symptoms: "Oral burning, drooling, vomiting, difficulty swallowing", safe_placement: "Keep away from pets and children" },
  "rubber plant": { pets: "low", humans: true, symptoms: "Skin and eye irritation from milky sap; oral irritation if ingested", safe_placement: "Sap can irritate skin" },
  "fiddle leaf fig": { pets: "low", humans: true, symptoms: "Oral irritation, skin irritation from sap", safe_placement: "Sap irritates skin and mouth" },
  "zz plant": { pets: "moderate", humans: true, symptoms: "Oral burning, swelling, vomiting; skin and eye irritation", safe_placement: "Highly toxic if ingested; keep well away from pets" },
  "jade plant": { pets: "moderate", humans: true, symptoms: "Vomiting, lethargy, depression, incoordination in pets", safe_placement: "Toxic to cats and dogs" },
  "croton": { pets: "moderate", humans: true, symptoms: "Oral irritation, vomiting, diarrhea; skin irritation from sap", safe_placement: "Sap is irritating" },
  "english ivy": { pets: "high", humans: true, symptoms: "Severe GI upset, drooling, vomiting, diarrhea, difficulty breathing", safe_placement: "Highly toxic to pets" },
  "parlor palm": { pets: "none", humans: false, symptoms: "Non-toxic; no symptoms expected", safe_placement: "Pet-safe" },
  "chinese evergreen": { pets: "moderate", humans: true, symptoms: "Oral irritation, drooling, vomiting", safe_placement: "Keep on tables or shelves away from pets" },
  "money tree": { pets: "none", humans: false, symptoms: "Non-toxic; no symptoms expected", safe_placement: "Pet-safe and child-safe" },
  "boston fern": { pets: "none", humans: false, symptoms: "Non-toxic to cats and dogs", safe_placement: "Pet-safe fern" },
  "bird of paradise": { pets: "low", humans: true, symptoms: "Mild gastrointestinal upset if seeds or flowers ingested", safe_placement: "Mildly toxic; keep seeds away from pets" },
  "lavender": { pets: "low", humans: false, symptoms: "Mild nausea in cats if large amounts consumed", safe_placement: "Generally safe" },
  "orchid": { pets: "none", humans: false, symptoms: "Non-toxic", safe_placement: "Pet-safe" },
  "fern": { pets: "none", humans: false, symptoms: "Non-toxic", safe_placement: "Pet-safe" },
  "succulent": { pets: "low", humans: true, symptoms: "Varies by species", safe_placement: "Check individual species toxicity" },
  "cacti": { pets: "low", humans: true, symptoms: "Physical spines are main hazard", safe_placement: "Keep away from children and pets" },
};

// --- CORS preflight handler ---
function corsResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

async function getWikimediaCommonsImage(searchTerm: string): Promise<string | null> {
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
      const page = pages ? Object.values(pages)[0] as any : null;
      if (page?.imageinfo?.[0]?.thumburl) {
        return page.imageinfo[0].thumburl;
      }
      if (page?.imageinfo?.[0]?.url) {
        return page.imageinfo[0].url;
      }
    }
    return null;
  } catch {
    return null;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, content-type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      },
    });
  }

  if (req.method !== "POST") {
    return corsResponse(405, { error: "Method not allowed" });
  }

  // Environment variables
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const plantIdApiKey = Deno.env.get("PLANT_ID_API_KEY");
  const perenualApiKey = Deno.env.get("PERENUAL_API_KEY");
  const opbClientId = Deno.env.get("OPENPLANTBOOK_CLIENT_ID");
  const opbClientSecret = Deno.env.get("OPENPLANTBOOK_CLIENT_SECRET");

  if (!supabaseUrl || !supabaseServiceKey) {
    return corsResponse(500, { error: "Supabase configuration missing" });
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

  // Parse body
  let body: { query?: string | null; imageBase64?: string | null };
  try {
    body = await req.json();
  } catch {
    return corsResponse(400, { error: "Invalid JSON body" });
  }

  const { query, imageBase64 } = body;
  const searchTerm = query?.trim();

  if (!searchTerm && !imageBase64) {
    return corsResponse(400, { error: "Either 'query' or 'imageBase64' must be provided" });
  }

  // ========================================
  // STEP 1: Search plant_library cache first
  // ========================================
  if (searchTerm) {
    const { data: libraryResults, error: libraryError } = await supabaseAdmin
      .from("plant_library")
      .select("*")
      .or(`species_name.ilike.%${searchTerm}%,common_name.ilike.%${searchTerm}%`)
      .limit(10);

    if (!libraryError && libraryResults && libraryResults.length > 0) {
      const exactMatch = libraryResults.find(
        (r) =>
          r.species_name?.toLowerCase() === searchTerm.toLowerCase() ||
          r.common_name?.toLowerCase() === searchTerm.toLowerCase()
      );
      const match = exactMatch || libraryResults[0];
      return corsResponse(200, {
        found: true,
        source: "library",
        data: {
          ...match,
          species_name: cleanSpeciesName(match.species_name),
        },
        alternatives: libraryResults,
      });
    }
  }

  // Variables to accumulate data from multiple sources
  let speciesName = searchTerm || "";
  let commonName: string | null = null;
  let description: string | null = null;
  let imageUrl: string | null = null;
  let light: string | null = null;
  let water: string | null = null;
  let difficulty: string | null = null;
  let toxicityInfo: ToxicityInfo | null = null;

  let plantIdCommonNames: string[] | null = null;
  let plantIdDescription: string | null = null;

  // ========================================
  // STEP 2: Plant.id image identification (if image provided)
  // ========================================
  if (imageBase64 && plantIdApiKey) {
    try {
      const plantIdResponse = await fetch("https://api.plant.id/v3/identification", {
        method: "POST",
        headers: {
          "Api-Key": plantIdApiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          images: [imageBase64],
          latitude: null,
          longitude: null,
          similar_images: true,
        }),
      });

      if (plantIdResponse.ok) {
        const plantIdData = await plantIdResponse.json();
        const accessToken = plantIdData.access_token;

        if (accessToken) {
          let suggestions: unknown[] = [];
          const maxAttempts = 10;
          let attempts = 0;

          while (attempts < maxAttempts) {
            await new Promise((resolve) => setTimeout(resolve, 1500));
            const statusResponse = await fetch(
              `https://api.plant.id/v3/identification/${accessToken}`,
              { headers: { "Api-Key": plantIdApiKey } }
            );
            if (statusResponse.ok) {
              const statusData = await statusResponse.json();
              if (statusData.result?.classification?.suggestions) {
                suggestions = statusData.result.classification.suggestions;
                break;
              }
            }
            attempts++;
          }

          if (suggestions.length > 0) {
            const top = suggestions[0] as {
              name: string;
              details?: { common_names?: string[] };
              description?: string;
              plant_details?: { wiki_description?: { value?: string } };
            };
            speciesName = cleanSpeciesName(top.name);
            plantIdCommonNames = top.details?.common_names ?? null;
            plantIdDescription =
              top.description || top.plant_details?.wiki_description?.value || null;
          }
        }
      }
    } catch (err) {
      console.error("Plant.id error:", err);
    }
  }

  // ========================================
  // STEP 3: Perenual search FIRST (to get scientific name)
  // ========================================
  let perenualScientificName: string | null = null;
  let perenualCommonName: string | null = null;
  let perenualId: number | null = null;
  if (perenualApiKey) {
    try {
      const perenualSearchRes = await fetch(
        `https://perenual.com/api/species-list?key=${perenualApiKey}&q=${encodeURIComponent(searchTerm || speciesName)}`
      );

      if (perenualSearchRes.ok) {
        const perenualSearchData = await perenualSearchRes.json();
        if (perenualSearchData.data && perenualSearchData.data.length > 0) {
          const firstMatch = perenualSearchData.data[0] as {
            id?: number;
            common_name?: string;
            scientific_name?: string[];
            default_image?: { regular_url?: string; original_url?: string; medium_url?: string };
          };

          perenualId = firstMatch.id ?? null;
          perenualCommonName = firstMatch.common_name || null;
          if (Array.isArray(firstMatch.scientific_name) && firstMatch.scientific_name.length > 0) {
            perenualScientificName = firstMatch.scientific_name[0];
          }

          // Use Perenual scientific name - always prefer it over raw search term
          if (perenualScientificName) {
            speciesName = cleanSpeciesName(perenualScientificName);
          }
          if (perenualCommonName) {
            commonName = perenualCommonName;
          }

          // Perenual free tier returns placeholder images - check and discard
          const perenualImage =
            firstMatch.default_image?.regular_url ||
            firstMatch.default_image?.original_url ||
            firstMatch.default_image?.medium_url ||
            null;
          if (perenualImage && !isBrokenOrPlaceholder(perenualImage)) {
            imageUrl = perenualImage;
          }

          // Try details endpoint (paywalled on free tier — wrap in try/catch)
          if (perenualId) {
            try {
              const detailsRes = await fetch(
                `https://perenual.com/api/species/details/${perenualId}?key=${perenualApiKey}`
              );
              if (detailsRes.ok) {
                const detailsData = await detailsRes.json();
                if (!description) description = detailsData.description || null;
                if (!light && detailsData.sunlight) {
                  light = Array.isArray(detailsData.sunlight)
                    ? detailsData.sunlight.join(", ")
                    : detailsData.sunlight;
                }
                if (!water) water = detailsData.watering || null;
                if (!difficulty) difficulty = detailsData.care_level || null;
              }
            } catch {
              // Free tier blocks details — ignore
            }
          }
        }
      }
    } catch (err) {
      console.error("Perenual error:", err);
    }
  }

  // ========================================
  // STEP 3b: PlantFYI fallback (if Perenual returned 0 results)
  // ========================================
  if (!perenualId && searchTerm) {
    try {
      const plantfyiRes = await fetch(
        `https://plantfyi.com/api/v1/search/?q=${encodeURIComponent(searchTerm)}`
      );
      if (plantfyiRes.ok) {
        const plantfyiData = await plantfyiRes.json();
        const match = (plantfyiData.results as Array<{ type?: string; name?: string; slug?: string }> | undefined)?.find(
          (r) => r.type === "plant"
        );
        if (match) {
          speciesName = cleanSpeciesName(match.name || speciesName);
          const detailRes = await fetch(`https://plantfyi.com/api/v1/plants/${match.slug}/`);
          if (detailRes.ok) {
            const detail = await detailRes.json() as {
              scientific_name?: string;
              image_path?: string;
            };
            speciesName = cleanSpeciesName(detail.scientific_name || match.name || speciesName);
            if (!imageUrl && detail.image_path) {
              const plantfyiImage = `https://plantfyi.com/${detail.image_path}`;
              // Verify image exists (HEAD request) before using
              try {
                const imgCheck = await fetch(plantfyiImage, { method: "HEAD" });
                if (imgCheck.ok) imageUrl = plantfyiImage;
              } catch { /* ignore */ }
            }
          }
        }
      }
    } catch (err) {
      console.error("PlantFYI error:", err);
    }
  }

  // ========================================
  // STEP 4: OpenPlantbook (using scientific name from Perenual)
  // ========================================
  let openPlantbookData: Record<string, unknown> | null = null;
  if (opbClientId && opbClientSecret) {
    try {
      const opbTokenRes = await fetch("https://open.plantbook.io/api/v1/token/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "client_credentials",
          client_id: opbClientId,
          client_secret: opbClientSecret,
        }),
      });

      if (opbTokenRes.ok) {
        const opbTokenData = await opbTokenRes.json();
        const opbToken = opbTokenData.access_token;

        // Use Perenual scientific name if available, otherwise fall back to search term / speciesName
        const searchForOpb = perenualScientificName || speciesName;
        const opbDetailRes = await fetch(
          `https://open.plantbook.io/api/v1/plant/detail/${encodeURIComponent(searchForOpb.toLowerCase())}/`,
          { headers: { Authorization: `Bearer ${opbToken}` } }
        );

        if (opbDetailRes.ok) {
          openPlantbookData = await opbDetailRes.json();
        }
      }
    } catch (err) {
      console.error("OpenPlantbook error:", err);
    }
  }

  if (openPlantbookData) {
    const data = openPlantbookData as {
      display_pid?: string;
      alias?: string;
      image_url?: string;
      max_light_lux?: number;
      min_light_lux?: number;
      max_temp?: number;
      min_temp?: number;
      max_soil_moist?: number;
      min_soil_moist?: number;
      origin?: string;
    };

    if (data.display_pid) speciesName = cleanSpeciesName(data.display_pid);
    if (data.alias && !commonName) commonName = data.alias;

    // OpenPlantbook has real images - use them (overwrite even if Perenual gave a placeholder)
    if (data.image_url && !isBrokenOrPlaceholder(data.image_url)) {
      imageUrl = data.image_url;
    }

    // Light levels
    const minLux = data.min_light_lux ?? 0;
    const maxLux = data.max_light_lux ?? 0;
    if (!light) {
      if (maxLux < 5000) light = "Low light";
      else if (maxLux < 15000) light = "Bright, indirect";
      else light = "Bright, direct";
    }

    // Watering estimate
    const minMoist = data.min_soil_moist ?? 0;
    const maxMoist = data.max_soil_moist ?? 0;
    const avgMoist = (minMoist + maxMoist) / 2;
    if (!water) {
      if (avgMoist < 20) water = "Every 14 days";
      else if (avgMoist < 40) water = "Every 7–10 days";
      else if (avgMoist < 60) water = "Every 5–7 days";
      else water = "Every 3–5 days";
    }

    // Difficulty based on temp range
    if (!difficulty) {
      const tempRange = (data.max_temp ?? 30) - (data.min_temp ?? 10);
      if (tempRange < 10) difficulty = "Easy";
      else if (tempRange < 20) difficulty = "Moderate";
      else difficulty = "Advanced";
    }
  }

  // ========================================
  // STEP 4b: Wikipedia image fallback (if OpenPlantbook had no image)
  // ========================================
  if (!imageUrl || isBrokenOrPlaceholder(imageUrl)) {
    try {
      const wikiImgRes = await fetch(
        `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(speciesName)}&prop=pageimages&format=json&pithumbsize=500&origin=*`
      );
      if (wikiImgRes.ok) {
        const wikiImgData = await wikiImgRes.json();
        const pages = wikiImgData.query?.pages;
        const firstPage = pages ? Object.values(pages)[0] as any : null;
        if (firstPage?.thumbnail?.source) {
          imageUrl = firstPage.thumbnail.source;
        }
      }
    } catch (err) {
      console.error("Wikipedia image error:", err);
    }
  }

  // ========================================
  // STEP 5: Wikipedia (using scientific name from Perenual)
  // ========================================
  try {
    // Use Perenual scientific name if available, otherwise fall back to current speciesName
    const wikiSearchTerm = perenualScientificName || speciesName;
    const wikiSearchRes = await fetch(
      `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(wikiSearchTerm)}&format=json&origin=*`
    );
    if (wikiSearchRes.ok) {
      const wikiSearchData = await wikiSearchRes.json();
      const wikiResults = wikiSearchData.query?.search || [];
      if (wikiResults.length > 0) {
        const wikiTitle = wikiResults[0].title;
        const wikiPageRes = await fetch(
          `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(wikiTitle)}&prop=pageimages|extracts&format=json&pithumbsize=500&exsentences=3&exintro=1&explaintext=1&origin=*`
        );
        if (wikiPageRes.ok) {
          const wikiPageData = await wikiPageRes.json();
          const pages = wikiPageData.query?.pages || {};
          const page = Object.values(pages)[0] as {
            thumbnail?: { source?: string };
            extract?: string;
          } | undefined;

          if (page) {
            // Wikipedia thumbnail as backup image (only if no image yet)
            if (!imageUrl && page.thumbnail?.source) {
              imageUrl = page.thumbnail.source;
            }
            // Wikipedia description as backup (only if no description yet)
            if (!description && page.extract) {
              description = page.extract;
            }
          }
        }
      }
    }
  } catch (err) {
    console.error("Wikipedia error:", err);
  }

  // Wikimedia Commons image search fallback
  if (!imageUrl || isBrokenOrPlaceholder(imageUrl)) {
    const commonsImage = await getWikimediaCommonsImage(speciesName + " plant");
    if (commonsImage) {
      imageUrl = commonsImage;
    } else if (commonName) {
      const commonsImageCommon = await getWikimediaCommonsImage(commonName + " plant");
      if (commonsImageCommon) {
        imageUrl = commonsImageCommon;
      }
    }
  }

  // ========================================
  // STEP 6: Fallbacks & toxicity check
  // ========================================
  if (!speciesName) {
    return corsResponse(404, { found: false, message: "No search query available" });
  }

  if (!commonName && plantIdCommonNames && plantIdCommonNames.length > 0) {
    commonName = plantIdCommonNames[0];
  }
  if (!description && plantIdDescription) {
    description = plantIdDescription;
  }

  // Determine toxicity from map if still unknown
  if (toxicityInfo === null) {
    const keysToTry = [
      speciesName.toLowerCase().replace(/\s*\(.*?\)\s*$/, "").trim(), // strip "(group)" etc
      speciesName.toLowerCase(),
      searchTerm?.toLowerCase(),
      commonName?.toLowerCase(),
    ];
    for (const key of keysToTry) {
      if (key && TOXICITY_MAP[key] !== undefined) {
        toxicityInfo = TOXICITY_MAP[key];
        break;
      }
    }
    // Default to non-toxic if not found in map
    if (toxicityInfo === null) {
      toxicityInfo = { pets: "none", humans: false, symptoms: "Non-toxic; no symptoms expected", safe_placement: "Pet-safe and child-safe" };
    }
  }

  // Apply defaults for empty/null fields before insert
  if (!light) light = "Medium light";
  if (!water) water = "Every 7 days";
  if (!difficulty) difficulty = "Moderate";
  if (!description) description = `${commonName || speciesName} is a popular houseplant.`;
  if (!commonName) commonName = speciesName;

  // ========================================
  // STEP 6b: Unsplash fallback image (last resort)
  // ========================================
  if (!imageUrl || isBrokenOrPlaceholder(imageUrl)) {
    imageUrl = "https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=400&h=400&fit=crop";
  }

  // ========================================
  // STEP 7: Insert into plant_library
  // ========================================
  const { data: inserted, error: insertError } = await supabaseAdmin
    .from("plant_library")
    .insert({
      species_name: speciesName,
      common_name: commonName,
      image_url: imageUrl,
      light,
      water,
      difficulty,
      description,
      toxicity_to_pets: toxicityInfo.pets,
      toxicity_to_humans: toxicityInfo.humans,
      symptoms: toxicityInfo.symptoms,
      safe_placement: toxicityInfo.safe_placement,
      source: "api_fallback",
    })
    .select()
    .single();

  if (insertError) {
    console.error("Insert error:", insertError);
    return corsResponse(200, {
      found: true,
      source: "api",
      data: {
        species_name: speciesName,
        common_name: commonName,
        image_url: imageUrl,
        light,
        water,
        difficulty,
        description,
        toxicity_to_pets: toxicityInfo.pets,
        toxicity_to_humans: toxicityInfo.humans,
        symptoms: toxicityInfo.symptoms,
        safe_placement: toxicityInfo.safe_placement,
      },
    });
  }

  return corsResponse(200, {
    found: true,
    source: "api_fallback",
    data: inserted,
  });
});
