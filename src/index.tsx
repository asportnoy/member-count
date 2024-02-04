import { Injector, Logger, common, components, settings, webpack } from "replugged";
import { GuildTooltip } from "./types";
import MemberCount from "./MemberCount";

const { lodash: _ } = common;
const { ErrorBoundary, Flex } = components;

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
  const tooltipMod = await webpack.waitForProps<{
    default: GuildTooltip;
    GuildTooltipText: () => unknown;
  }>("GuildTooltipText", "default");

  inject.after(tooltipMod, "default", ([{ disabled, guild }], res) => {
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

export function start(): void {
  void patchGuildTooltip();
}

export function stop(): void {
  inject.uninjectAll();
}

export function _patchMemberList(args: {
  channel?: { isThread: () => boolean };
}): React.ReactElement | void {
  if (!cfg.get("showInMemberList")) return;

  const isThread = args.channel?.isThread();

  if (!args.channel && !isThread) return;

  return (
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
    </>
  );
}
