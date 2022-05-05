import React, { HTMLAttributes } from "react";
import Image from "next/image";

import HeroBase, { Button } from "./Hero.css";

interface IHeroProps extends HTMLAttributes<HTMLHeadElement> {
  srcImage: string;
}

const Hero: React.FC<IHeroProps> = ({ className, srcImage }) => {
  return (
    <HeroBase className={className}>
      <Image
        alt="Natours Hero's Image"
        layout="fill"
        objectFit="cover"
        src={srcImage}
      />

      <div className="absolute inset-0 z-10">
        <div className="flex flex-col items-center justify-center h-full">
          <h1 className="heading-primary mb-10">
            <span className="heading-primary--main text-3xl lg:text-6xl pb-6">
              Outdoors
            </span>
            <span className="heading-primary--sub text-sm lg:text-xl">
              is where life happens
            </span>
          </h1>

          <Button>Discover our tours</Button>
        </div>
      </div>
    </HeroBase>
  );
};

export default Hero;
