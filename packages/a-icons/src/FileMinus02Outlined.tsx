import * as React from "react";
import Icon, { IconProps } from "a-base-icon/lib/icon";

function FileMinus02Outlined(componentProps: IconProps) {
  const IconNode = (props: React.SVGProps<SVGSVGElement>) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M15.2 1c.824 0 1.502-.001 2.052.044.562.046 1.08.144 1.564.392a4.001 4.001 0 011.748 1.748c.248.485.346 1.002.392 1.564.045.55.044 1.228.044 2.052v5.141h-2V6.8c0-.857 0-1.439-.037-1.889-.036-.438-.101-.663-.18-.82a2 2 0 00-.875-.873c-.156-.08-.38-.145-.82-.18C16.639 3 16.058 3 15.2 3H8.8c-.857 0-1.439 0-1.889.037-.438.036-.663.101-.82.18a2 2 0 00-.873.875c-.08.156-.145.38-.18.82C5 5.361 5 5.942 5 6.8v10.4c0 .857 0 1.439.037 1.889.036.438.101.663.18.82a2 2 0 00.875.873c.156.08.38.145.82.18C7.361 21 7.942 21 8.8 21H15v2H8.8c-.824 0-1.502.001-2.052-.044-.562-.046-1.08-.144-1.564-.392a4.001 4.001 0 01-1.748-1.748c-.248-.485-.346-1.002-.392-1.564C2.999 18.702 3 18.024 3 17.2V6.8c0-.824-.001-1.502.044-2.052.046-.562.144-1.08.392-1.564a4.001 4.001 0 011.748-1.748c.485-.248 1.002-.346 1.564-.392C7.298.999 7.976 1 8.8 1h6.4zm7.507 16.293a1 1 0 010 1.414L19 22.414 17.586 21l2-2H13v-2h6.586l-2-2L19 13.586l3.707 3.707zM11 16H7v-2h4v2zm4-4H7v-2h8v2zm2-4H7V6h10v2z"
        fill="currentColor"
      />
    </svg>
  );

  return <Icon {...componentProps} component={IconNode} />;
}

FileMinus02Outlined.displayName = "FileMinus02Outlined";
export default FileMinus02Outlined;
