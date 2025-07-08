# Contributing to the MDD Web Development

## Steps to contribute

If you are contributing as a part of the MDD Web Development team, you can clone the repository and make changes in your own branch.

To clone the repository, use the following command:

```bash
git clone [repo]
```

For other contributors, you can fork the repository and clone it to your local machine.

### Install Node.js using a Node Version Manager

Two commonly used node version managers are [NVM](https://github.com/nvm-sh/nvm) and [fnm](https://github.com/Schniz/fnm). We recommend using [FNM](https://github.com/Schniz/fnm) because it is faster and cross-platform by default. You can follow the installation instructions on the [FNM GitHub page](https://github.com/Schniz/fnm).

Briefly, you can install `fnm` and `Node.js` using the following command:

```bash
# installs fnm (Fast Node Manager)
curl -fsSL https://fnm.vercel.app/install | bash

# activate fnm
source ~/.bashrc

# download and install Node.js
fnm use --install-if-missing 22

# verifies the correct Node.js version is in the environment
node -v # should print `v22.11.0`

# verifies the correct npm version is in the environment
npm -v # should print `10.9.0`
```

Follow the instructions on the [Node.js website](https://nodejs.org/en/download/) for other installation methods.

### Enable Corepack and install dependencies

We use [yarn](https://yarnpkg.com/) to manage the website dependencies. Yarn comes with a plugin called [Corepack](https://yarnpkg.com/features/corepack) and is available by default when you install Node.js. First, we need to enable Corepack and install the dependencies.

```bash
corepack enable

cd mammaldiversity-org

yarn install
```

### Start the development server

This command will start the development server. You can view the website by visiting the URL provided in the terminal.

```bash
yarn run dev
```

### Make changes

First, create a new branch to make changes.

```bash
git checkout -b [branch-name]
```

You can make changes to the website by editing the files in the `src` directory. The website is built using [Astro](https://astro.build/) and [Tailwind CSS](https://tailwindcss.com/). Check out the documentation for these technologies to learn more about how to make changes.

### Create a pull request

After you have made changes, you can create a pull request to merge your changes into the main branch. You can do this by pushing your branch to the repository and creating a pull request on GitHub.

```bash
git push origin [branch-name]
```

Then, go to the GitHub repository and create a pull request. Make sure to include a description of the changes you made and any relevant information for the reviewers.

### Review and merge

After you have created a pull request, the MDD Web Development team will review your changes. If everything looks good, your changes will be merged into the main branch.

## How-to guides

### Release a new version of MDD

The data release process is managed by a GitHub Actions workflow defined in [.github/workflows/deploy.yml](https://github.com/mammaldiversity/mammaldiversity-org/blob/main/.github/workflows/deploy.yml).

To publish a new data release, simply re-run the most recent successful deployment workflow:

1. Navigate to the **Actions** tab in the GitHub repository.
2. Select the **Deploy to GitHub Pages** workflow.
3. Click on the latest successful run.
4. Click the **Re-run all jobs** button to trigger the workflow.

The workflow will automatically fetch the latest data from the [assets directory](https://github.com/mammaldiversity/mammaldiversity.github.io/tree/master/assets/data) in the classic repository. This process also runs automatically for any new commits or approved pull requests merged into the `main` branch.

## Deep dive into the codebase and MDD software architecture

### Project Structure

```bash
.
├── .github/
│   └── workflows/
├── db/
│   └── data/
├── public/
├── src/
│   ├── assets/
│   ├── components/
│   ├── data/
│   ├── layouts/
│   ├── pages/
│   └── scripts/
├── tests/
├── .gitignore
├── astro.config.mjs
├── CITATION.cff
├── CNAME
├── CONTRIBUTING.md
├── LICENSE
├── package.json
├── playwright.config.ts
├── README.md
├── tailwind.config.mjs
├── tsconfig.json
└── yarn.lock
```

- **`.github/`**: Contains GitHub Actions workflows for continuous integration and deployment.
- **`db/`**: Holds the data models, scripts, and raw data files related to the Mammal Diversity Database.
- **`public/`**: Stores static assets that are copied directly to the build output without processing, such as `favicon.svg` and `CNAME`.
- **`src/`**: Contains all the source code for the Astro application.
  - **`assets/`**: For assets that will be processed by Astro, like images and custom fonts.
  - **`components/`**: Reusable UI components (`.astro`, `.tsx`).
  - **`data/`**: Data files used within the application.
  - **`layouts/`**: Defines the UI structure for different types of pages.
  - **`pages/`**: Represents the routes of the website. Each file becomes a page.
  - **`scripts/`**: Client-side TypeScript and JavaScript for interactive features.
- **`tests/`**: End-to-end tests written with Playwright.

### Data Flow

The data for the website is stored in JSON files in the `db/data` directory. These files are read by scripts in the `db` directory, which then provide the data to the Astro components and pages.

1. **Data Source**: The primary data is stored in `db/data/mdd.json`, which contains the main mammal diversity data. Additional data includes country statistics (`db/data/country_stats.json`) and country region codes (`db/data/country_region_code.json`).
2. **Data Parsing**: The scripts in the `db` directory (e.g., `mdd.ts`, `country_stats.ts`) are responsible for parsing the JSON data and providing it to the application.
3. **Page Generation**: The Astro pages in `src/pages` import the data from the `db` scripts and use it to generate the static HTML pages.
4. **Search Indexing**: After the site is built, the `pagefind` script is run to create a search index of the content in the `dist` directory. This allows for fast, client-side search functionality.

### Page Build Process

The website is automatically built and deployed using a GitHub Actions workflow defined in `.github/workflows/deploy.yml`. This process ensures that the latest data is always reflected on the live site.

The build process consists of the following steps:

1. **Checkout Repository**: The workflow begins by checking out the latest version of the repository.
2. **Setup Environment**: It sets up the necessary environment, including Node.js and Rust.
3. **Install MDD CLI**: A command-line tool, `mdd_api`, is installed using `cargo`. This tool is used to process the raw MDD data.
4. **Data Extraction**: The latest Mammal Diversity Database data is downloaded as a ZIP file. The `mdd` CLI is then used to extract the data into the `db/data` directory.
5. **Build Site**: The `withastro/action` is used to build the Astro site. This action performs the following sub-steps:
    - Installs Node.js dependencies using `yarn install`.
    - Runs the `build` script from `package.json`, which executes `astro check && astro build`. This command type-checks the code and generates the static HTML, CSS, and JavaScript files in the `dist/` directory.
    - Runs the `postbuild` script, which executes `pagefind --site dist` to create a search index for the generated site.
6. **Deployment**: Once the build is complete, the contents of the `dist/` directory are deployed to GitHub Pages.

### ISO 3166-1 alpha-2 Country Codes

The code is implemented in Rust and made available to the TypeScript as json files in: `db/data/country_region_code.json`. The code implementation is in the [mdd_api](https://github.com/mammaldiversity/mdd_app/blob/main/mdd_api/src/helper/country_code.rs). This approach allows us to maintain a single source for the web, API, CLI, and GUI applications.

>Note: This list is temporary. We will eventually update it as the country distribution data is standardized in the MDD.

| Code | Country Name |
|------|-------------------------------|
| AF | Afghanistan |
| AX | Åland Islands |
| AL | Albania |
| DZ | Algeria |
| AS | American Samoa |
| AD | Andorra |
| AO | Angola |
| AI | Anguilla |
| AQ | Antarctica |
| AG | Antigua and Barbuda |
| AR | Argentina |
| AM | Armenia |
| AW | Aruba |
| AU | Australia |
| AT | Austria |
| AZ | Azerbaijan |
| BS | Bahamas |
| BH | Bahrain |
| BD | Bangladesh |
| BB | Barbados |
| BY | Belarus |
| BE | Belgium |
| BZ | Belize |
| BJ | Benin |
| BM | Bermuda |
| BT | Bhutan |
| BO | Bolivia (Plurinational State of) |
| BQ | Bonaire, Sint Eustatius and Saba |
| BA | Bosnia and Herzegovina |
| BW | Botswana |
| BV | Bouvet Island |
| BR | Brazil |
| IO | British Indian Ocean Territory |
| BN | Brunei Darussalam |
| BG | Bulgaria |
| BF | Burkina Faso |
| BI | Burundi |
| CV | Cabo Verde |
| KH | Cambodia |
| CM | Cameroon |
| CA | Canada |
| KY | Cayman Islands |
| CF | Central African Republic |
| TD | Chad |
| CL | Chile |
| CN | China |
| CX | Christmas Island |
| CC | Cocos (Keeling) Islands |
| CO | Colombia |
| KM | Comoros |
| CG | Congo |
| CD | Congo, Democratic Republic of the |
| CK | Cook Islands |
| CR | Costa Rica |
| CI | Côte d'Ivoire |
| HR | Croatia |
| CU | Cuba |
| CW | Curaçao |
| CY | Cyprus |
| CZ | Czechia |
| DK | Denmark |
| DJ | Djibouti |
| DM | Dominica |
| DO | Dominican Republic |
| EC | Ecuador |
| EG | Egypt |
| SV | El Salvador |
| GQ | Equatorial Guinea |
| ER | Eritrea |
| EE | Estonia |
| SZ | Eswatini |
| ET | Ethiopia |
| FK | Falkland Islands (Malvinas) |
| FO | Faroe Islands |
| FJ | Fiji |
| FI | Finland |
| FR | France |
| GF | French Guiana |
| PF | French Polynesia |
| TF | French Southern Territories |
| GA | Gabon |
| GM | Gambia |
| GE | Georgia |
| DE | Germany |
| GH | Ghana |
| GI | Gibraltar |
| GR | Greece |
| GL | Greenland |
| GD | Grenada |
| GP | Guadeloupe |
| GU | Guam |
| GT | Guatemala |
| GG | Guernsey |
| GN | Guinea |
| GW | Guinea-Bissau |
| GY | Guyana |
| HT | Haiti |
| HM | Heard Island and McDonald Islands |
| VA | Holy See |
| HN | Honduras |
| HK | Hong Kong |
| HU | Hungary |
| IS | Iceland |
| IN | India |
| ID | Indonesia |
| IR | Iran (Islamic Republic of) |
| IQ | Iraq |
| IE | Ireland |
| IM | Isle of Man |
| IL | Israel |
| IT | Italy |
| JM | Jamaica |
| JP | Japan |
| JE | Jersey |
| JO | Jordan |
| KZ | Kazakhstan |
| KE | Kenya |
| KI | Kiribati |
| KP | Korea (Democratic People's Republic of) |
| KR | Korea, Republic of |
| KW | Kuwait |
| KG | Kyrgyzstan |
| LA | Lao People's Democratic Republic |
| LV | Latvia |
| LB | Lebanon |
| LS | Lesotho |
| LR | Liberia |
| LY | Libya |
| LI | Liechtenstein |
| LT | Lithuania |
| LU | Luxembourg |
| MO | Macao |
| MG | Madagascar |
| MW | Malawi |
| MY | Malaysia |
| MV | Maldives |
| ML | Mali |
| MT | Malta |
| MH | Marshall Islands |
| MQ | Martinique |
| MR | Mauritania |
| MU | Mauritius |
| YT | Mayotte |
| MX | Mexico |
| FM | Micronesia (Federated States of) |
| MD | Moldova, Republic of |
| MC | Monaco |
| MN | Mongolia |
| ME | Montenegro |
| MS | Montserrat |
| MA | Morocco |
| MZ | Mozambique |
| MM | Myanmar |
| NA | Namibia |
| NR | Nauru |
| NP | Nepal |
| NL | Netherlands |
| NC | New Caledonia |
| NZ | New Zealand |
| NI | Nicaragua |
| NE | Niger |
| NG | Nigeria |
| NU | Niue |
| NF | Norfolk Island |
| MK | North Macedonia |
| MP | Northern Mariana Islands |
| NO | Norway |
| OM | Oman |
| PK | Pakistan |
| PW | Palau |
| PS | Palestine, State of |
| PA | Panama |
| PG | Papua New Guinea |
| PY | Paraguay |
| PE | Peru |
| PH | Philippines |
| PN | Pitcairn |
| PL | Poland |
| PT | Portugal |
| PR | Puerto Rico |
| QA | Qatar |
| RE | Réunion |
| RO | Romania |
| RU | Russian Federation |
| RW | Rwanda |
| BL | Saint Barthélemy |
| SH | Saint Helena, Ascension and Tristan da Cunha |
| KN | Saint Kitts and Nevis |
| LC | Saint Lucia |
| MF | Saint Martin (French part) |
| PM | Saint Pierre and Miquelon |
| VC | Saint Vincent and the Grenadines |
| WS | Samoa |
| SM | San Marino |
| ST | Sao Tome and Principe |
| SA | Saudi Arabia |
| SN | Senegal |
| RS | Serbia |
| SC | Seychelles |
| SL | Sierra Leone |
| SG | Singapore |
| SX | Sint Maarten (Dutch part) |
| SK | Slovakia |
| SI | Slovenia |
| SB | Solomon Islands |
| SO | Somalia |
| ZA | South Africa |
| GS | South Georgia and the South Sandwich Islands |
| SS | South Sudan |
| ES | Spain |
| LK | Sri Lanka |
| SD | Sudan |
| SR | Suriname |
| SJ | Svalbard and Jan Mayen |
| SE | Sweden |
| CH | Switzerland |
| SY | Syrian Arab Republic |
| TW | Taiwan, Province of China |
| TJ | Tajikistan |
| TZ | Tanzania, United Republic of |
| TH | Thailand |
| TL | Timor-Leste |
| TG | Togo |
| TK | Tokelau |
| TO | Tonga |
| TT | Trinidad and Tobago |
| TN | Tunisia |
| TR | Turkey |
| TM | Turkmenistan |
| TC | Turks and Caicos Islands |
| TV | Tuvalu |
| UG | Uganda |
| UA | Ukraine |
| AE | United Arab Emirates |
| GB | United Kingdom |
| UM | United States Minor Outlying Islands |
| US | United States of America |
| UY | Uruguay |
| UZ | Uzbekistan |
| VU | Vanuatu |
| VE | Venezuela (Bolivarian Republic of) |
| VN | Viet Nam |
| VG | Virgin Islands (British) |
| VI | Virgin Islands (U.S.) |
| WF | Wallis and Futuna |
| EH | Western Sahara |
| YE | Yemen |
| ZM | Zambia |
| ZW | Zimbabwe |

### Non-standard Country Names (MDD Data)

| Code | Country Name |
|------|-------------------------------|
| IN | Andaman and Nicobar Islands |
| IN | Andaman Islands |
| IR | Iran |
| PT | Azores |
| PT | Madeira |
| EC | Galápagos Islands |
| FK | Falkland Islands |
| TF | French Southern and Antarctic Lands |
| CV | Cape Verde |
| CI | Cote d'Ivoire |
| CI | Côte d'Ivoire |
| ST | São Tomé and Príncipe |
| ST | São Tomé & Príncipe |
| SX | Sint Maarten |
| MP | Northern Marianas |
| AG | Antigua & Barbuda |
| BO | Bolivia |
| BA | Bosnia & Herzegovina |
| VG | British Virgin Islands |
| BN | Brunei |
| CZ | Czech Republic |
| CD | Democratic Republic of the Congo |
| TL | East Timor |
| XK | Kosovo |
| LA | Laos |
| FM | Micronesia |
| MD | Moldova |
| KP | North Korea |
| PS | Palestine |
| CG | Republic of the Congo |
| RU | Russia |
| SH | Saint Helena |
| KN | Saint Kitts & Nevis |
| MF | Saint Martin |
| VC | Saint Vincent & the Grenadines |
| KR | South Korea |
| SY | Syria |
| TW | Taiwan |
| TZ | Tanzania |
| TT | Trinidad & Tobago |
| TC | Turks & Caicos Islands |
| US | United States |
| VI | United States Virgin Islands |
| VE | Venezuela |
| VN | Vietnam |
| FO | Faroe |
| AC | Ascension |
| RE | Reunion |
| GS | South Georgia & the South Sandwich Islands |
| WF | Wallis & Futuna |

### Known Region Names (Non-country Regions)

| Code | Region Name |
|------|-------------------------------|
| ALS | Alaska |
| AND | Andaman Islands |
| AZO | Azores |
| BON | Bonaire |
| CNY | Canary Islands |
| COC | Cocos Islands |
| GAL | Galapagos |
| KER | Kerguelen Islands |
| MAD | Madeira |
| NIC | Nicobar Islands |
| PEI | Prince Edward Islands |
| REU | Reunion |
| SAB | Saba |
| STE | Sint Eustatius |
| SGS | South Georgia & the South Sandwich Islands |
| WAF | Wallis & Futuna |

### US State Names

| State Name |
|------------|
| Alabama |
| Alaska |
| Arizona |
| Arkansas |
| California |
| Colorado |
| Connecticut |
| Delaware |
| Florida |
| Georgia |
| Hawai'i |
| Idaho |
| Illinois |
| Indiana |
| Iowa |
| Kansas |
| Kentucky |
| Louisiana |
| Maine |
| Maryland |
| Massachusetts |
| Michigan |
| Minnesota |
| Mississippi |
| Missouri |
| Montana |
| Nebraska |
| Nevada |
| New Hampshire |
| New Jersey |
| New Mexico |
| New York |
| North Carolina |
| North Dakota |
| Ohio |
| Oklahoma |
| Oregon |
| Pennsylvania |
| Rhode Island |
| South Carolina |
| South Dakota |
| Tennessee |
| Texas |
| Utah |
| Vermont |
| Virginia |
| Washington |
| West Virginia |
| Wisconsin |
| Wyoming |
