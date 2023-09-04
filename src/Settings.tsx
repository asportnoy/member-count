import { components, util } from "replugged";
import { cfg } from ".";

const { SwitchItem } = components;

export function Settings(): React.ReactElement {
  return (
    <>
      <SwitchItem
        {...util.useSetting(cfg, "showInMemberList")}
        note="The server's member count will be shown at the top of the member list.">
        Show in Member List
      </SwitchItem>
      <SwitchItem
        {...util.useSetting(cfg, "showInGuildTooltip")}
        note="The server's member count will be shown in the tooltip when hovering over a server's icon in the sidebar.">
        Show in Server Tooltip
      </SwitchItem>
    </>
  );
}
