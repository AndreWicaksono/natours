import React, { HTMLAttributes, useState } from "react";
import useEventListener from "utils/Hooks/useEventListener";

import {
  NavigationBarBaseSolid,
  NavigationBarBaseTransparent,
} from "./NavigationBar.css";

interface INavigationBarProps extends HTMLAttributes<HTMLDivElement> {
  navRight?: React.ReactElement;
}

const NavigationBar: React.FC<INavigationBarProps> = ({
  className = "px-6 lg:px-12",
  navRight,
}) => {
  const [modeTransparent, setModeTransparent] = useState<boolean>(true);

  const content: React.ReactElement = (
    <React.Fragment>
      <div className="inline-block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          alt="Natours Logo White"
          height={35}
          width={68.25}
          src="/PNG/Logo/natours-logo-white.png"
        />
      </div>

      {navRight && navRight}
    </React.Fragment>
  );

  const onScroll = (event: Event) => {
    if (window.scrollY > 200) {
      setModeTransparent(false);
    } else {
      setModeTransparent(true);
    }
  };

  useEventListener("scroll", onScroll);

  if (!modeTransparent)
    return (
      <NavigationBarBaseSolid className={className}>
        {content}
      </NavigationBarBaseSolid>
    );

  return (
    <NavigationBarBaseTransparent className={className}>
      {content}
    </NavigationBarBaseTransparent>
  );
};

export default NavigationBar;
