import React from "react";
import { WatercolorLogo, WatercolorLogoProps } from "./WatercolorLogo";

export interface LogoProps extends WatercolorLogoProps {}

export function Logo(props: LogoProps) {
  return <WatercolorLogo {...props} />;
}

export { WatercolorLogo };
export type { WatercolorLogoProps };
