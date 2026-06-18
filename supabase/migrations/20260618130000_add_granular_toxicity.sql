ALTER TABLE plant_library
ADD COLUMN IF NOT EXISTS toxicity_to_pets text,
ADD COLUMN IF NOT EXISTS toxicity_to_humans boolean,
ADD COLUMN IF NOT EXISTS symptoms text,
ADD COLUMN IF NOT EXISTS safe_placement text;
