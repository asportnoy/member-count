import { common } from "replugged";
import { logger } from ".";

const { api, fluxDispatcher } = common;

let stopUntil: number | null = null;
let numFetches = 0;
const MAX_SIMULTANEOUS_FETCHES = 1;

export async function fetchGuildPopout(guildId: string): Promise<boolean> {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (!common.constants.Endpoints) {
    logger.error("replugged.common.constants.Endpoints is not defined", {
      constants: common.constants,
    });
    return false;
  }
  if (stopUntil && stopUntil > Date.now()) {
    logger.warn("Skipping guild popout fetch due to rate limit");
    return false;
  }
  if (numFetches >= MAX_SIMULTANEOUS_FETCHES) {
    logger.warn("Skipping guild popout fetch due to too many simultaneous fetches");
    return false;
  }

  fluxDispatcher.dispatch({
    type: "GUILD_POPOUT_FETCH_START",
    guildId,
  });

  numFetches++;
  try {
    const res = await api
      .get({
        url: (common.constants.Endpoints.GUILD_PREVIEW as (guildId: string) => string)(guildId),
        oldFormErrors: true,
      })
      .catch((err) => {
        if (err && err.status === 429) {
          const retryAfter = err.body.retry_after;
          if (retryAfter && typeof retryAfter === "number") {
            logger.warn(`Guild popout fetch rate limited, blocking requests for ${retryAfter}s`);
            stopUntil = Date.now() + retryAfter * 1000;
          }
        }
        throw err;
      });
    if (!res.ok) {
      throw new Error(`Failed to fetch guild popout for ${guildId}: ${JSON.stringify(res.body)}`);
    }

    fluxDispatcher.dispatch({
      type: "GUILD_POPOUT_FETCH_SUCCESS",
      guildId,
      guild: res.body,
    });

    return true;
  } catch (err) {
    logger.error(`Failed to fetch guild popout for ${guildId}`, err);

    fluxDispatcher.dispatch({
      type: "GUILD_POPOUT_FETCH_FAILURE",
      guildId,
    });

    return false;
  } finally {
    numFetches--;
  }
}
