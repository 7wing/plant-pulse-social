const TERMS = [
  "monstera deliciosa", "pothos", "sansevieria trifasciata", "aloe vera",
  "echeveria", "nephrolepis exaltata", "spider plant", "peace lily",
  "ficus elastica", "fiddle leaf fig", "zz plant", "philodendron",
  "jade plant", "calathea", "croton", "dracaena marginata",
  "english ivy", "parlor palm", "chinese evergreen", "yucca filamentosa",
  "begonia", "phalaenopsis", "boston fern", "pachira aquatica",
  "alocasia", "anthurium", "strelitzia reginae", "euphorbia trigona",
  "eucalyptus", "lavandula angustifolia",
  // Additional indoor
  "aglaonema modestum", "dieffenbachia seguine", "dracaena fragrans",
  "epipremnum aureum", "spathiphyllum wallisii",
  // succulents
  "haworthia attenuata", "sedum morganianum", "kalanchoe blossfeldiana",
  "crassula ovata", "aloe aristata",
  // rare
  "philodendron pink princess", "monstera adansonii",
  "string of pearls", "hoya carnosa",
  // propagation
  "tradescantia zebrina", "pilea peperomioides",
  "rhaphidophora tetrasperma", "peperomia obtusifolia",
  // gardening/outdoor
  "hosta plantaginea", "hemerocallis fulva", "hydrangea macrophylla",
  "rosa chinensis", "lavandula angustifolia",
  // tropical
  "heliconia rostrata", "alpinia purpurata", "caladium bicolor",
  // cacti
  "gymnocalycium mihanovichii", "mammillaria hahniana", "opuntia microdasys",
  "echinocactus grusonii", "astrophytum myriostigma",
];

async function seed(term, i) {
  try {
    const res = await fetch(
      "https://kjmgtctcwwqsrepoldor.supabase.co/functions/v1/plant-lookup",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtqbWd0Y3Rjd3dxc3JlcG9sZG9yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwMDg1NzIsImV4cCI6MjA5NjU4NDU3Mn0.tBcwK8s6tXJs7r49ry0xC8U4wzvMrlkc0OBJtFrmqCM",
          "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtqbWd0Y3Rjd3dxc3JlcG9sZG9yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwMDg1NzIsImV4cCI6MjA5NjU4NDU3Mn0.tBcwK8s6tXJs7r49ry0xC8U4wzvMrlkc0OBJtFrmqCM"
        },
        body: JSON.stringify({ query: term })
      }
    );
    const json = await res.json();
    if (json.found) {
      console.log(`[${i+1}/${TERMS.length}] OK: ${json.data.species_name} (tox=${json.data.toxicity_to_pets})`);
      return true;
    } else {
      console.log(`[${i+1}/${TERMS.length}] MISS: ${term}`);
      return false;
    }
  } catch (e) {
    console.log(`[${i+1}/${TERMS.length}] ERR: ${term} - ${e.message}`);
    return false;
  }
}

let ok = 0;
for (let i = 0; i < TERMS.length; i++) {
  const success = await seed(TERMS[i], i);
  if (success) ok++;
  await new Promise(r => setTimeout(r, 1500));
}
console.log(`\nDone: ${ok}/${TERMS.length} successful`);
