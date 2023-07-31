require("dotenv").config();

const { loadJson, saveJson } = require("./src/utils");
const { initNear } = require("./src/near");
const Social = require("./src/social");

const StateFilename = "res/" + (process.env.STATE_FILENAME || "state.json");
const DefaultState = {
  finalBlockHeight: 0,
};

const verifyIsHuman = async (nearInstance, accountId) => {
  const isHuman = await nearInstance.viewCall(
    "registry.i-am-human.near",
    "sbt_tokens_by_owner",
    {
      account: accountId,
      issuer: "fractal.i-am-human.near",
    }
  );
  return { isHuman: Boolean(isHuman?.[0]?.[1]?.[0]), accountId };
};

(async () => {
  const near = await initNear();
  const social = new Social(near);
  const state = Object.assign(DefaultState, loadJson(StateFilename, true));
  const indexAllPosts = await social.index("post", "main", {
    order: "desc",
    ...(state.finalBlockHeight
      ? { from: state.finalBlockHeight, order: "asc" }
      : { limit: 1 }),
  });
  const allPostsToCheck = indexAllPosts.filter(
    (item) => item.blockHeight !== state.finalBlockHeight
  );
  state.finalBlockHeight = indexAllPosts[indexAllPosts.length - 1].blockHeight;
  const accountRepliedTo = [];
  allPostsToCheck.reverse().map(async (item) => {
    const { isHuman, accountId } = await verifyIsHuman(near, item.accountId);
    console.log(isHuman, accountId, item);
    if (!accountRepliedTo.includes(accountId)) {
      if (isHuman) {
        social.comment(
          {
            type: "social",
            path: `${item.accountId}/post/main`,
            blockHeight: item.blockHeight,
          },
          `Hey @${item.accountId}, as a verified Human you can vote right now at https://neardc.org/election. For more details on election rules go here. You have _x_ amount of days left to vote (ends on Sep __)`,
          undefined,
          undefined,
          {
            ipfs_cid:
              "bafkreigpacjefuqlirwwtvaoziyo2puqdtx2cebga2silbqhfftx3fwdje",
          }
        );
      } else {
        social.comment(
          {
            type: "social",
            path: `${item.accountId}/post/main`,
            blockHeight: item.blockHeight,
            image: {
              ipfs: "bafkreigpacjefuqlirwwtvaoziyo2puqdtx2cebga2silbqhfftx3fwdje",
            },
          },
          `Hey @${item.accountId}, remember to register as a Human at https://i-am-human.app to be a member of the @neardigitalcollective.near voting body. Elections start at Sep 8, see all the nominated candidates at https://neardc.org/nominate.`,
          undefined,
          item.accountId
        );
      }
      accountRepliedTo.push(item.accountId);
    }
  });
  saveJson(state, StateFilename);
})();

//set an interval to fetch posts
//get all the posts that happened in the last 2 days from now if there is no blockheight
//all the posts that we comment under should be listed inside the state json file
