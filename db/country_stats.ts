// Module to handle country statistic generation and retrieval
import fs from "fs";

import type { CountryMDDStats } from "./country_stats_model";

const COUNTRY_STATS_PATH = "./db/data/country_stats.json";

function parseCountryStatsJson(): CountryMDDStats {
  const rawData = fs.readFileSync(COUNTRY_STATS_PATH, "utf8");
  const jsonData: CountryMDDStats = JSON.parse(rawData);
  return jsonData;
}

export { parseCountryStatsJson };
