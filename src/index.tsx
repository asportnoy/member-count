import { Injector, Logger, common, components, webpack } from "replugged";
import { ListThin } from "./types";
import MemberCount from "./MemberCount";

const { lodash: _ } = common;
const { ErrorBoundary } = components;

const inject = new Injector();
export const logger = Logger.plugin("MemberCount");

export async function start(): Promise<void> {
  const listMod = await webpack.waitForProps<{
    ListThin: ListThin;
  }>("ListThin");

  inject.after(listMod.ListThin, "render", ([args], res) => {
    const isChannel = args["data-list-id"]?.startsWith("members-");
    const isThread = !isChannel && args.className?.startsWith("members-");

    console.log(args, isChannel, isThread);
    if (!isChannel && !isThread) return;

    const children = _.get(
      res.props,
      isThread ? "children.0.props.children.props.children" : "children",
    );
    if (!children || !Array.isArray(children)) {
      logger.error("Failed to find children", { props: res.props, children, isThread });
      return;
    }

    console.log(res, children);

    children.unshift(
      <>
        <ErrorBoundary fallback={<></>}>
          <MemberCount />
        </ErrorBoundary>
      </>,
    );
  });
}

export function stop(): void {
  inject.uninjectAll();
}
