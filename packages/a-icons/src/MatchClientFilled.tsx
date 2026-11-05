import * as React from "react";
import Icon, { IconProps } from "a-base-icon/lib/icon";

function MatchClientFilled(componentProps: IconProps) {
  const IconNode = (props: React.SVGProps<SVGSVGElement>) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      {...props}
    >
      <path
        d="M17.256 13a4.75 4.75 0 013.99 7.327L22.92 22l-1.413 1.415-1.675-1.673A4.75 4.75 0 1117.256 13zm0 2a2.75 2.75 0 100 5.5 2.75 2.75 0 000-5.5z"
        fillRule="evenodd"
        clipRule="evenodd"
        fill="currentColor"
      />
      <path
        d="M11.654 14a7.465 7.465 0 00-1.154 4c0 1.47.423 2.842 1.154 4H2v-3a5 5 0 015-5h4.654zM12 1a5.5 5.5 0 110 11 5.5 5.5 0 010-11z"
        fill="currentColor"
      />
    </svg>
  );

  return <Icon {...componentProps} component={IconNode} />;
}

MatchClientFilled.displayName = "MatchClientFilled";
export default MatchClientFilled;
