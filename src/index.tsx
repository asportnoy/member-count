import { Injector, Logger, common, components, settings, webpack } from "replugged";
import { GuildTooltip, ListThin } from "./types";
import { Flex } from "replugged/components";
import MemberCount from "./MemberCount";

const { lodash: _ } = common;
const { ErrorBoundary } = components;

const inject = new Injector();
export const logger = Logger.plugin("MemberCount");

interface Settings {
  showInMemberList?: boolean;
  showInGuildTooltip?: boolean;
}

const defaultSettings = {
  showInMemberList: true,
  showInGuildTooltip: true,
} satisfies Settings;

export { Settings } from "./Settings";

export const cfg = await settings.init<Settings, keyof typeof defaultSettings>(
  "dev.albertp.MemberCount",
  defaultSettings,
);

async function patchGuildTooltip(): Promise<void> {
  const tooltipMod = await webpack.waitForModule<Record<string, GuildTooltip>>(
    webpack.filters.bySource(".guildNameText,{"),
  );
  const key = webpack.getFunctionKeyBySource(tooltipMod, ".listItemTooltip,");
  if (!key) {
    logger.error("Failed to find guild tooltip key");
    return;
  }

  inject.after(tooltipMod, key, ([{ disabled, guild }], res) => {
    if (!cfg.get("showInGuildTooltip")) return;
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (disabled || !guild) return;
    if (!res || typeof res !== "object" || !("props" in res)) return;
    if (!Array.isArray(res.props.text)) res.props.text = [res.props.text];

    res.props.text.push(
      <ErrorBoundary fallback={<></>}>
        <Flex
          direction={Flex.Direction.HORIZONTAL}
          align={Flex.Align.START}
          style={{
            marginTop: "6px",
            gap: "12px",
          }}>
          <MemberCount guildId={guild.id} compact={true} />
        </Flex>
      </ErrorBoundary>,
    );
  });
}

async function patchMemberList(): Promise<void> {
  const listMod = await webpack.waitForProps<{
    ListThin: ListThin;
  }>("ListThin");

  inject.after(listMod.ListThin, "render", ([args], res) => {
    if (!cfg.get("showInMemberList")) return;
    const isChannel = args["data-list-id"]?.startsWith("members-");
    const isThread = !isChannel && args.className?.startsWith("members-");

    if (!isChannel && !isThread) return;

    const children = _.get(
      res.props,
      isThread ? "children.0.props.children.props.children" : "children",
    );
    if (!children || !Array.isArray(children)) {
      logger.error("Failed to find children", { props: res.props, children, isThread });
      return;
    }

    children.unshift(
      <>
        <ErrorBoundary fallback={<></>}>
          <Flex
            direction={Flex.Direction.VERTICAL}
            align={Flex.Align.CENTER}
            style={{
              marginTop: "20px",
              gap: "4px",
            }}>
            <MemberCount compact={false} />
          </Flex>
        </ErrorBoundary>
      </>,
    );
  });
}

export function start(): void {
  void patchMemberList();
  void patchGuildTooltip();
}

export function stop(): void {
  inject.uninjectAll();
}
