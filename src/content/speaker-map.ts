export type SpeakerProfile = {
  id: string;
  name: string;
  avatarSrc?: string;
  side: "left" | "right";
};

export const speakerMap: Record<string, SpeakerProfile> = {
  xuruowei: {
    id: "xuruowei",
    name: "若薇",
    avatarSrc: "/avatar.JPG",
    side: "right",
  },
  gaoce: {
    id: "gaoce",
    name: "我",
    avatarSrc: "/avatar-gaoce.jpeg",
    side: "left",
  },
  editor: {
    id: "editor",
    name: "旁白",
    avatarSrc: "",
    side: "left",
  },
};
