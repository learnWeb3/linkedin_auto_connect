const { join } = require("path");
const LinkedInBoleanSearchScrapper = require("./src/LinkedInBoleanSearchScrapper");

require("dotenv").config({
  path: join(process.cwd(), ".env"),
});

const { LINKEDIN_AUTH_TOKEN, LINKEDIN_SEARCH_URL, CONNECT_MESSAGE } =
  process.env;

const SCRAPPER = new LinkedInBoleanSearchScrapper(
  LINKEDIN_AUTH_TOKEN,
  LINKEDIN_SEARCH_URL,
  CONNECT_MESSAGE,
  10
);

SCRAPPER.run()
  .then(async () => {
    await SCRAPPER.kill();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error(error);
    SCRAPPER.kill();
    process.exit(0);
  });
