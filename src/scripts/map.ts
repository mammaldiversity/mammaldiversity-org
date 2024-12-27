import leaflet from "leaflet";

const assetUrl =
  "https://raw.githubusercontent.com/mammaldiversity/mammaldiversity.github.io/refs/heads/master/assets/countries/";

export function drawCountriesOnMap(
  countryDistribution: string,
  elementId: string
) {
  let countries = splitCountryDistribution(countryDistribution);
  let countryCodes = matchAllCountriesToCodeName(countries);

  // initialize Leaflet
  let map = leaflet.map(elementId);

  // add the OpenStreetMap tiles
  leaflet
    .tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap contributors</a>',
    })
    .addTo(map);

  let distribution = new leaflet.FeatureGroup();
  countryCodes.forEach(function (countryCode) {
    async function addGeoJson() {
      const response = await fetch(assetUrl + countryCode + ".json");
      const shape = await response.json();
      if (shape) {
        distribution.addLayer(leaflet.geoJSON(shape));
        distribution.addTo(map);
        if (distribution.getLayers().length > 0) {
          map.fitBounds(distribution.getBounds());
        }
      }
    }

    addGeoJson();
  });
}

function splitCountryDistribution(countryDistribution: string): string[] {
  return countryDistribution.split("|").map((country) => country.trim());
}

function matchAllCountriesToCodeName(countries: string[]): string[] {
  return countries.map((country) => countryCode[country]);
}

const countryCode: { [key: string]: string } = {
  Afghanistan: "AFG",
  Albania: "ALB",
  Algeria: "DZA",
  Andorra: "AND",
  Angola: "AGO",
  "Antigua and Barbuda": "ATG",
  Argentina: "ARG",
  Armenia: "ARM",
  Australia: "AUS",
  Austria: "AUT",
  Azerbaijan: "AZE",
  Bahamas: "BHS",
  Bahrain: "BHR",
  Bangladesh: "BGD",
  Barbados: "BRB",
  Belarus: "BLR",
  Belgium: "BEL",
  Belize: "BLZ",
  Benin: "BEN",
  Bhutan: "BTN",
  Bolivia: "BOL",
  "Bosnia and Herzegovina": "BIH",
  Botswana: "BWA",
  Brazil: "BRA",
  Brunei: "BRN",
  Bulgaria: "BGR",
  "Burkina Faso": "BFA",
  Burundi: "BDI",
  "Cabo Verde": "CPV",
  Cambodia: "KHM",
  Cameroon: "CMR",
  Canada: "CAN",
  "Central African Republic": "CAF",
  Chad: "TCD",
  Chile: "CHL",
  China: "CHN",
  Colombia: "COL",
  Comoros: "COM",
  Congo: "COG",
  "Costa Rica": "CRI",
  Croatia: "HRV",
  Cuba: "CUB",
  Cyprus: "CYP",
  "Czech Republic": "CZE",
  "Democratic Republic of the Congo": "COD",
  Denmark: "DNK",
  Djibouti: "DJI",
  Dominica: "DMA",
  "Dominican Republic": "DOM",
  Ecuador: "ECU",
  Egypt: "EGY",
  "El Salvador": "SLV",
  "Equatorial Guinea": "GNQ",
  Eritrea: "ERI",
  Estonia: "EST",
  Eswatini: "SWZ",
  Ethiopia: "ETH",
  Fiji: "FJI",
  Finland: "FIN",
  France: "FRA",
  Gabon: "GAB",
  Gambia: "GMB",
  Georgia: "GEO",
  Germany: "DEU",
  Ghana: "GHA",
  Greece: "GRC",
  Grenada: "GRD",
  Guatemala: "GTM",
  Guinea: "GIN",
  "Guinea-Bissau": "GNB",
  Guyana: "GUY",
  Haiti: "HTI",
  Honduras: "HND",
  Hungary: "HUN",
  Iceland: "ISL",
  India: "IND",
  Indonesia: "IDN",
  Iran: "IRN",
  Iraq: "IRQ",
  Ireland: "IRL",
  Israel: "ISR",
  Italy: "ITA",
  "Ivory Coast": "CIV",
  Jamaica: "JAM",
  Japan: "JPN",
  Jordan: "JOR",
  Kazakhstan: "KAZ",
  Kenya: "KEN",
  Kiribati: "KIR",
  "North Korea": "PRK",
  "South Korea": "KOR",
  Kuwait: "KWT",
  Kyrgyzstan: "KGZ",
  Laos: "LAO",
  Latvia: "LVA",
  Lebanon: "LBN",
  Lesotho: "LSO",
  Liberia: "LBR",
  Libya: "LBY",
  Liechtenstein: "LIE",
  Lithuania: "LTU",
  Luxembourg: "LUX",
  Madagascar: "MDG",
  Malawi: "MWI",
  Malaysia: "MYS",
  Maldives: "MDV",
  Mali: "MLI",
  Malta: "MLT",
  "Marshall Islands": "MHL",
  Mauritania: "MRT",
  Mauritius: "MUS",
  Mexico: "MEX",
  Micronesia: "FSM",
  Moldova: "MDA",
  Monaco: "MCO",
  Mongolia: "MNG",
  Montenegro: "MNE",
  Morocco: "MAR",
  Mozambique: "MOZ",
  Myanmar: "MMR",
  Namibia: "NAM",
  Nauru: "NRU",
  Nepal: "NPL",
  Netherlands: "NLD",
  "New Zealand": "NZL",
  Nicaragua: "NIC",
  Niger: "NER",
  Nigeria: "NGA",
  "North Macedonia": "MKD",
  Norway: "NOR",
  Oman: "OMN",
  Pakistan: "PAK",
  Palau: "PLW",
  Panama: "PAN",
  "Papua New Guinea": "PNG",
  Paraguay: "PRY",
  Peru: "PER",
  Philippines: "PHL",
  Poland: "POL",
  Portugal: "PRT",
  Qatar: "QAT",
  Romania: "ROU",
  Russia: "RUS",
  Rwanda: "RWA",
  "Saint Kitts and Nevis": "KNA",
  "Saint Lucia": "LCA",
  "Saint Vincent and the Grenadines": "VCT",
  Samoa: "WSM",
  "San Marino": "SMR",
  "Sao Tome and Principe": "STP",
  "Saudi Arabia": "SAU",
  Senegal: "SEN",
  Serbia: "SRB",
  Seychelles: "SYC",
  "Sierra Leone": "SLE",
  Singapore: "SGP",
  Slovakia: "SVK",
  Slovenia: "SVN",
  "Solomon Islands": "SLB",
  Somalia: "SOM",
  "South Africa": "ZAF",
  "South Sudan": "SSD",
  Spain: "ESP",
  "Sri Lanka": "LKA",
  Sudan: "SDN",
  Suriname: "SUR",
  Sweden: "SWE",
  Switzerland: "CHE",
  Syria: "SYR",
  Taiwan: "TWN",
  Tajikistan: "TJK",
  Tanzania: "TZA",
  Thailand: "THA",
  "Timor-Leste": "TLS",
  Togo: "TGO",
  Tonga: "TON",
  "Trinidad and Tobago": "TTO",
  Tunisia: "TUN",
  Turkey: "TUR",
  Turkmenistan: "TKM",
  Tuvalu: "TUV",
  Uganda: "UGA",
  Ukraine: "UKR",
  "United Arab Emirates": "ARE",
  "United Kingdom": "GBR",
  "United States": "USA",
  Uruguay: "URY",
  Uzbekistan: "UZB",
  Vanuatu: "VUT",
  "Vatican City": "VAT",
  Venezuela: "VEN",
  Vietnam: "VNM",
  Yemen: "YEM",
  Zambia: "ZMB",
  Zimbabwe: "ZWE",
};
