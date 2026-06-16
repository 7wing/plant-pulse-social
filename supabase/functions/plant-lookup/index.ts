import { createClient } from "jsr:@supabase/supabase-js@2";

Deno.serve(async (req: Request) => {
  // CORS preflight
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
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }

  // Validate environment variables
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const plantIdApiKey = Deno.env.get("PLANT_ID_API_KEY");
  const perenualApiKey = Deno.env.get("PERENUAL_API_KEY");

  if (!supabaseUrl || !supabaseServiceKey) {
    return new Response(JSON.stringify({ error: "Supabase configuration missing" }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }

  if (!perenualApiKey) {
    return new Response(JSON.stringify({ error: "Perenual API key missing" }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }

  // Create service role client for admin operations
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

  // Parse request body
  let body: { query?: string | null; imageBase64?: string | null };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }

  const { query, imageBase64 } = body;

  // Must provide either query or imageBase64
  if (!query && !imageBase64) {
    return new Response(
      JSON.stringify({ error: "Either 'query' or 'imageBase64' must be provided" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      }
    );
  }

  // Determine the search term (for library search)
  const searchTerm = query?.trim();

  // ========================================
  // STEP 1: Search plant_library first
  // ========================================
  if (searchTerm) {
    const { data: libraryResults, error: libraryError } = await supabaseAdmin
      .from("plant_library")
      .select("*")
      .or(`species_name.ilike.%${searchTerm}%,common_name.ilike.%${searchTerm}%`)
      .limit(10);

    if (libraryError) {
      console.error("plant_library search error:", libraryError);
    } else if (libraryResults && libraryResults.length > 0) {
      // Filter to find best match
      const exactMatch = libraryResults.find(
        (r) =>
          r.species_name?.toLowerCase() === searchTerm.toLowerCase() ||
          r.common_name?.toLowerCase() === searchTerm.toLowerCase()
      );

      return new Response(
        JSON.stringify({
          found: true,
          source: "library",
          data: exactMatch || libraryResults[0],
          alternatives: libraryResults,
        }),
        {
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        }
      );
    }
  }

  // ========================================
  // STEP 2: Not in library - use external APIs
  // ========================================

  let searchQuery = searchTerm;
  let plantIdCommonNames: string[] | null = null;
  let plantIdDescription: string | null = null;

  // If image is provided, use Plant.id to identify the plant
  if (imageBase64) {
    if (!plantIdApiKey) {
      return new Response(JSON.stringify({ error: "Plant.id API key missing for image identification" }), {
        status: 500,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    try {
      // Call Plant.id API v3 for identification
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

      if (!plantIdResponse.ok) {
        const errorText = await plantIdResponse.text();
        console.error("Plant.id identification error:", errorText);
        throw new Error("Plant.id identification failed");
      }

      const plantIdData = await plantIdResponse.json();
      const accessToken = plantIdData.access_token;

      if (!accessToken) {
        throw new Error("No access token returned from Plant.id");
      }

      // Poll for results
      let suggestions: unknown[] = [];
      const maxAttempts = 10;
      let attempts = 0;

      while (attempts < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 1500)); // Wait 1.5 seconds

        const statusResponse = await fetch(
          `https://api.plant.id/v3/identification/${accessToken}`,
          {
            headers: { "Api-Key": plantIdApiKey },
          }
        );

        if (!statusResponse.ok) {
          attempts++;
          continue;
        }

        const statusData = await statusResponse.json();

        if (statusData.result?.classification?.suggestions) {
          suggestions = statusData.result.classification.suggestions;
          break;
        }

        attempts++;
      }

      if (suggestions.length === 0) {
        return new Response(
          JSON.stringify({ found: false, message: "Could not identify plant from image" }),
          {
            status: 404,
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
          }
        );
      }

      // Get top suggestion
      const topSuggestion = suggestions[0];
      searchQuery = topSuggestion.name;
      plantIdCommonNames = topSuggestion.details?.common_names ?? null;
      plantIdDescription =
        topSuggestion.description ||
        topSuggestion.plant_details?.wiki_description?.value ||
        null;
    } catch (error) {
      console.error("Plant.id error:", error);
      return new Response(
        JSON.stringify({ found: false, message: "Image identification failed" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        }
      );
    }
  }

  // Ensure we have a search query for Perenual
  if (!searchQuery) {
    return new Response(
      JSON.stringify({ found: false, message: "No search query available" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      }
    );
  }

  // ========================================
  // STEP 3: Search Perenual API
  // ========================================
  try {
    const encodedQuery = encodeURIComponent(searchQuery);
    const perenualSearchUrl = `https://perenual.com/api/species-list?key=${perenualApiKey}&q=${encodedQuery}`;

    const perenualResponse = await fetch(perenualSearchUrl);

    if (!perenualResponse.ok) {
      throw new Error(`Perenual API error: ${perenualResponse.status}`);
    }

    const perenualData = await perenualResponse.json();

    if (!perenualData.data || perenualData.data.length === 0) {
      return new Response(
        JSON.stringify({ found: false, message: "No results found in Perenual" }),
        {
          status: 404,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        }
      );
    }

    // Get the first match's ID
    const firstMatch = perenualData.data[0];
    const perenualId = firstMatch.id;

    // ========================================
    // STEP 4: Get Perenual species details
    // ========================================
    const perenualDetailsUrl = `https://perenual.com/api/species/details/${perenualId}?key=${perenualApiKey}`;

    const detailsResponse = await fetch(perenualDetailsUrl);

    if (!detailsResponse.ok) {
      throw new Error(`Perenual details API error: ${detailsResponse.status}`);
    }

    const detailsData = await detailsResponse.json();

    // Extract Perenual data
    const scientificName = searchQuery; // Use the name we searched with (could be from Plant.id)
    const commonName =
      detailsData.common_name ||
      plantIdCommonNames?.[0] ||
      null;
    const description =
      plantIdDescription ||
      detailsData.description ||
      null;
    const imageUrl =
      detailsData.default_image?.regular_url ||
      detailsData.default_image?.original_url ||
      detailsData.default_image?.medium_url ||
      null;
    const sunlight = detailsData.sunlight
      ? Array.isArray(detailsData.sunlight)
        ? detailsData.sunlight.join(", ")
        : detailsData.sunlight
      : null;
    const watering = detailsData.watering || null;
    const careLevel = detailsData.care_level || null;
    const toxicity = detailsData.poisonous_to_pets || detailsData.poisonous_to_humans ? true : null;

    // ========================================
    // STEP 5: Insert into plant_library
    // ========================================
    const { data: inserted, error: insertError } = await supabaseAdmin
      .from("plant_library")
      .insert({
        species_name: scientificName,
        common_name: commonName,
        description: description,
        image_url: imageUrl,
        light: sunlight,
        water: watering,
        difficulty: careLevel,
        toxicity: toxicity,
        source: "api_fallback",
      })
      .select()
      .single();

    if (insertError) {
      console.error("Insert error:", insertError);
      // Still return the merged data even if insert fails
      return new Response(
        JSON.stringify({
          found: true,
          source: "api",
          data: {
            species_name: scientificName,
            common_name: commonName,
            description: description,
            image_url: imageUrl,
            light: sunlight,
            water: watering,
            difficulty: careLevel,
            toxicity: toxicity,
          },
          perenual_id: perenualId,
        }),
        {
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        }
      );
    }

    // ========================================
    // STEP 6: Return the result
    // ========================================
    return new Response(
      JSON.stringify({
        found: true,
        source: "api_fallback",
        data: inserted,
        perenual_id: perenualId,
      }),
      {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      }
    );
  } catch (error) {
    console.error("Perenual error:", error);
    return new Response(
      JSON.stringify({ found: false, message: "External API search failed" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      }
    );
  }
});