import type { SVGProps } from "react";

type SocialIconProps = SVGProps<SVGSVGElement>;

const iconProps = {
  viewBox: "0 0 24 24",
  width: 24,
  height: 24,
  fill: "currentColor",
  focusable: false,
  "aria-hidden": true,
} as const;

export function InstagramIcon(props: SocialIconProps) {
  return (
    <svg {...iconProps} {...props}>
      <path d="M7.8 2h8.4A5.8 5.8 0 0 1 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8A5.8 5.8 0 0 1 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2Zm-.2 2A3.6 3.6 0 0 0 4 7.6v8.8A3.6 3.6 0 0 0 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6A3.6 3.6 0 0 0 16.4 4H7.6Zm9.65 1.5a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5ZM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z" />
    </svg>
  );
}

export function TikTokIcon(props: SocialIconProps) {
  return (
    <svg {...iconProps} {...props}>
      <path d="M16.6 1.5c.18 1.52 1.03 2.87 2.32 3.68A6.2 6.2 0 0 0 22.5 6.3v3.2a9.4 9.4 0 0 1-5.85-2.03v8.04a7.01 7.01 0 1 1-6.05-6.94v3.25a3.8 3.8 0 1 0 2.84 3.68V1.5h3.16Z" />
    </svg>
  );
}

export function YouTubeIcon(props: SocialIconProps) {
  return (
    <svg {...iconProps} {...props}>
      <path d="M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.5 3.55 12 3.55 12 3.55s-7.5 0-9.38.5A3.02 3.02 0 0 0 .5 6.19 31.3 31.3 0 0 0 0 12a31.3 31.3 0 0 0 .5 5.81 3.02 3.02 0 0 0 2.12 2.14c1.88.5 9.38.5 9.38.5s7.5 0 9.38-.5a3.02 3.02 0 0 0 2.12-2.14A31.3 31.3 0 0 0 24 12a31.3 31.3 0 0 0-.5-5.81ZM9.6 15.57V8.43L15.86 12 9.6 15.57Z" />
    </svg>
  );
}
