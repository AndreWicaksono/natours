import React, { HTMLAttributes } from "react";

import FooterBase, { FooterCopyright, NavigationLinks } from "./Footer.css";

const Footer: React.FC<HTMLAttributes<HTMLElement>> = ({
  className = "py-16",
}) => {
  return (
    <FooterBase className={className}>
      <div className="flex flex-col items-center">
        <picture className="pb-12 lg:pb-20">
          <source
            srcSet="/SVG/logo/logo-green-small-1x.svg 1x, /SVG/logo/logo-green-small-2x.svg 2x"
            media="(max-width: 37.5em)"
          />
          {/*  eslint-disable-next-line @next/next/no-img-element */}
          <img
            srcSet="/SVG/logo/logo-green-1x.svg 1x, /SVG/logo/logo-green-2x.svg 2x"
            alt="Full logo"
            src="/SVG/logo/logo-green-2x.svg"
          />
        </picture>

        <div className="flex flex-col lg:flex-row lg:w-full lg:justify-evenly">
          <NavigationLinks className="max-w-sm lg:max-w-full">
            <ul className="text-center lg:text-left">
              <li className="footer__item">
                <a href="#" className="footer__link">
                  Company
                </a>
              </li>
              <li className="footer__item">
                <a href="#" className="footer__link">
                  Contact us
                </a>
              </li>
              <li className="footer__item">
                <a href="#" className="footer__link">
                  Carrers
                </a>
              </li>
              <li className="footer__item">
                <a href="#" className="footer__link">
                  Privacy policy
                </a>
              </li>
              <li className="footer__item">
                <a href="#" className="footer__link">
                  Terms
                </a>
              </li>
            </ul>
          </NavigationLinks>

          <FooterCopyright className="max-w-sm">
            Built by{" "}
            <a href="#" className="footer__link">
              Jonas Schmedtmann
            </a>{" "}
            for his online course{" "}
            <a href="#" className="footer__link">
              Advanced CSS and Sass
            </a>
            . Copyright © by Jonas Schmedtmann. You are 100% allowed to use this
            webpage for both personal and commercial use, but NOT to claim it as
            your own design. A credit to the original author, Jonas Schmedtmann,
            is of course highly appreciated!
          </FooterCopyright>
        </div>
      </div>
    </FooterBase>
  );
};

export default Footer;
