import { common, components, webpack } from "replugged";
import { GuildMemberCountStore, GuildPopoutStore, SelectedChannelStore } from "./types";
import { logger } from ".";
import { fetchGuildPopout } from "./util";

const { React, i18n, channels } = common;
const { Flex } = components;

const lastFetchedMap = new Map<string, number>();

export default function MemberCount(): React.ReactNode {
  const GuildMemberCountStore =
    webpack.getByStoreName<GuildMemberCountStore>("GuildMemberCountStore");
  if (!GuildMemberCountStore) {
    logger.error("Failed to find GuildMemberCountStore");
    return;
  }
  const GuildPopoutStore = webpack.getByStoreName<GuildPopoutStore>("GuildPopoutStore");
  if (!GuildPopoutStore) {
    logger.error("Failed to find GuildPopoutStore");
    return;
  }
  const SelectedChannelStore = webpack.getByStoreName<SelectedChannelStore>("SelectedChannelStore");
  if (!SelectedChannelStore) {
    logger.error("Failed to find SelectedChannelStore");
    return;
  }

  const classes = webpack.getByProps<
    Record<"status" | "statusOnline" | "statusOffline" | "statusWrapper" | "count", string>
  >("status", "statusOnline", "statusOffline", "statusWrapper", "count");
  if (!classes) {
    logger.error("Failed to find dot classes");
    return;
  }

  const [onlineCount, setOnlineCount] = React.useState<number | null>(null);
  const [memberCount, setMemberCount] = React.useState<number | null>(null);

  const update = (): void => {
    const channelId = SelectedChannelStore.getChannelId();
    const guildId = channels.getChannel(channelId || "")?.guild_id;
    if (!guildId || !/^\d+$/.test(guildId)) {
      setOnlineCount(null);
      setMemberCount(null);
      return;
    }

    const popoutGuild = GuildPopoutStore.getGuild(guildId);
    const isFetching = GuildPopoutStore.isFetchingGuild(guildId);
    const lastFetched = lastFetchedMap.get(guildId);
    const isExpired = !lastFetched || Date.now() - lastFetched > 1000 * 60 * 5;
    if ((!popoutGuild || isExpired) && !isFetching) {
      void fetchGuildPopout(guildId).finally(() => {
        lastFetchedMap.set(guildId, Date.now());
      });
    }

    const memberStoreCount = GuildMemberCountStore.getMemberCount(guildId);

    setOnlineCount(popoutGuild?.presenceCount || null);
    setMemberCount(memberStoreCount || popoutGuild?.memberCount || null);
  };

  React.useEffect(() => {
    update();

    const stores = [GuildMemberCountStore, GuildPopoutStore, SelectedChannelStore];

    stores.forEach((store) => store.addChangeListener(update));
    return () => {
      stores.forEach((store) => store.removeChangeListener(update));
    };
  }, []);

  const children: React.ReactNode[] = [];

  if (onlineCount) {
    const msg = i18n.Messages.INSTANT_INVITE_GUILD_MEMBERS_ONLINE.format({
      membersOnline: onlineCount,
    });
    const dot = <i className={`${classes.statusOnline} ${classes.status}`} />;

    children.push(
      <div className={classes.statusWrapper}>
        {dot}
        <span className={classes.count}>{msg}</span>
      </div>,
    );
  }

  if (memberCount) {
    const msg = i18n.Messages.INSTANT_INVITE_GUILD_MEMBERS_TOTAL.format({
      count: memberCount,
    });
    const dot = <i className={`${classes.statusOffline} ${classes.status}`} />;

    children.push(
      <div className={classes.statusWrapper}>
        {dot}
        <span className={classes.count}>{msg}</span>
      </div>,
    );
  }

  if (!children.length) return null;

  return (
    <Flex
      direction={Flex.Direction.VERTICAL}
      align={Flex.Align.CENTER}
      style={{
        marginTop: "20px",
        gap: "4px",
      }}>
      {children}
    </Flex>
  );
}
