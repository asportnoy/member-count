import { PlaintextPatch } from "replugged/dist/types";
export default [
  {
    find: ".AnalyticsSections.MEMBER_LIST",
    replacements: [
      {
        match: /(navigator:\w+,children:)(.+?updateMaxContentFeedRowSeen:\w+}\))/,
        replace: (_: string, prefix: string, children: string) =>
          `${prefix}[replugged.plugins.getExports("dev.albertp.MemberCount")._patchMemberList(arguments[0]),${children}]`,
      },
    ],
  },
] as PlaintextPatch[];
