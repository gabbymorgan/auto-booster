import axios from "axios";
import dotenv from "dotenv";
import moment from "moment";

dotenv.config();
const FRESH_TOOTS = [];

axios.defaults.headers.common[
  "Authorization"
] = `Bearer ${process.env.AUTH_TOKEN}`;

const getAccountIdsFromListRequest = async (listId) => {
  const getAccountsFromListResponse = await axios.get(
    `https://${process.env.DOMAIN_NAME}/api/v1/lists/${listId}/accounts`
  );
  return getAccountsFromListResponse.data.map((account) => account.id);
};

const populateFreshTootsRequest = async (accountId) => {
  const getTootsResponse = await axios.get(
    `https://${process.env.DOMAIN_NAME}/api/v1/accounts/${accountId}/statuses`
  );
  for (let tootIndex in getTootsResponse.data) {
    const toot = getTootsResponse.data[tootIndex];
    if (
      moment(toot.created_at).isAfter(moment().startOf("week")) &&
      !toot.reblogged
    ) {
      FRESH_TOOTS.push(toot.id);
    }
  }
};

const boostTootRequest = async (tootId) => {
  axios
    .post(`https://${process.env.DOMAIN_NAME}/api/v1/statuses/${tootId}/reblog`)
    .then(() => console.log("Nice!"))
    .catch((error) => console.log(error.response.data));
};

const allFreshTootsRequest = async (accountIds) =>
  await Promise.all(
    accountIds.map(async (accountId) => {
      return await populateFreshTootsRequest(accountId);
    })
  );

(async function main() {
  const accountIdsFromList = await getAccountIdsFromListRequest(
    process.env.LIST_ID
  );
  await allFreshTootsRequest(accountIdsFromList);
  await Promise.all(
    FRESH_TOOTS.map(async (tootId) => await boostTootRequest(tootId))
  );
})().catch((err) => console.log(err));
