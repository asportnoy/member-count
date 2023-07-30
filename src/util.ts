import { common } from "replugged";
import { logger } from ".";

const { api, constants, fluxDispatcher } = common;

export async function fetchGuildPopout(guildId: string): Promise<void> {
  fluxDispatcher.dispatch({
    type: "GUILD_POPOUT_FETCH_START",
    guildId,
  });

  try {
    const res = await api.get({
      url: (constants.Endpoints.GUILD_PREVIEW as (guildId: string) => string)(guildId),
      oldFormErrors: true,
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch guild popout for ${guildId}: ${JSON.stringify(res.body)}`);
    }

    fluxDispatcher.dispatch({
      type: "GUILD_POPOUT_FETCH_SUCCESS",
      guildId,
      guild: res.body,
    });
  } catch (err) {
    logger.error(`Failed to fetch guild popout for ${guildId}`, err);

    fluxDispatcher.dispatch({
      type: "GUILD_POPOUT_FETCH_FAILURE",
      guildId,
    });
  }
}
