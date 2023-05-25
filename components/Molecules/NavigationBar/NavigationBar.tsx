import Link from "next/link";
import { useRouter } from "next/router";
import React, { HTMLAttributes, useEffect, useState } from "react";
import useEventListener from "utils/Hooks/useEventListener";

import {
  NavigationBarBaseSolid,
  NavigationBarBaseTransparent,
} from "./NavigationBar.css";

interface INavigationBarProps extends HTMLAttributes<HTMLDivElement> {
  navRight?: React.ReactElement;
  pathnameTransparentMode?: Array<string>;
}

const NavigationBar: React.FC<INavigationBarProps> = ({
  className = "px-4 lg:px-12",
  navRight,
  pathnameTransparentMode = [],
}) => {
  const [modeTransparent, setModeTransparent] = useState<boolean>(true);

  const { pathname } = useRouter();

  const isCurrentPageNeedTransparentMode =
    pathnameTransparentMode.includes(pathname);

  const content: React.ReactElement = (
    <React.Fragment>
      <div className="inline-block">
        <Link href="/" passHref>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            alt="Natours Logo White"
            className="cursor-pointer"
            src="/PNG/Logo/natours-logo-white.png"
            height={25}
            width={60}
          />
        </Link>
      </div>

      {navRight && navRight}
    </React.Fragment>
  );

  const onScroll = (event: Event) => {
    if (isCurrentPageNeedTransparentMode) {
      if (window.scrollY > 200) {
        setModeTransparent(false);
      } else {
        setModeTransparent(true);
      }
    }
  };

  useEffect(() => {
    setModeTransparent(isCurrentPageNeedTransparentMode);
  }, [isCurrentPageNeedTransparentMode]);

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
