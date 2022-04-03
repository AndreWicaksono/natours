import React, { HTMLAttributes } from "react";

import NavigationBarBase from "./NavigationBar.css";

interface INavigationBarProps extends HTMLAttributes<HTMLDivElement> {
  navRight?: React.ReactElement;
}

const NavigationBar: React.FC<INavigationBarProps> = ({
  className = "px-12",
  navRight,
}) => {
  return (
    <NavigationBarBase className={className}>
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
    </NavigationBarBase>
  );
};

export default NavigationBar;
