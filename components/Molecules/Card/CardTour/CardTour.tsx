import React, { HTMLAttributes } from "react";
import Image from "next/image";

import CardTourBase, {
  CardDetails,
  CardFooter,
  CardHeader,
  CardPicture,
} from "./CardTour.css";
import { LoadingBar } from "components/Atoms/General.css";

import {
  ClockIcon,
  MapPinIcon,
  StarIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";

import { generateNumberBetweenRange } from "utils/Number";

export interface ICardTourProps
  extends HTMLAttributes<HTMLDivElement> {
  duration: number | null | undefined;
  loading?: boolean;
  location: string | null | undefined;
  name: string | undefined;
  photoPreview?: string | null;
  price: string;
  rating?: number;
}

const CardTour: React.FC<ICardTourProps> = ({
  duration,
  loading = true,
  location,
  name,
  photoPreview,
  price,
  rating,
  ...props
}) => {
  if (loading) {
    return (
      <div
        role="status"
        className="w-full space-y-8 animate-pulse md:space-y-0 shadow-[rgba(0,_0,_0,_0.12)_0px_1px_6px_0px]"
      >
        <div className="flex items-center justify-center w-full h-[180px] bg-gray-300 rounded-tr rounded-tl dark:bg-gray-700"></div>
        <div className="w-full p-4 min-h-[120px]">
          <div className="h-3 bg-gray-200 rounded-full dark:bg-gray-700 mb-3"></div>

          <div className="flex justify-between mb-5">
            <div className="basis-4/12 h-2 w-1/3 bg-gray-200 rounded-md dark:bg-gray-700"></div>
            <div className="basis 4/12 h-2 w-1/3 bg-gray-200 rounded-md dark:bg-gray-700 max-w-[480px]"></div>
          </div>

          <div className="h-2 w-1/3 bg-gray-200 rounded-md dark:bg-gray-700"></div>
        </div>
        <CardFooter className="min-h-[54px]"></CardFooter>
        <span className="sr-only">Loading...</span>
      </div>
    );
  }

  return (
    <CardTourBase {...props}>
      <CardHeader>
        <CardPicture>
          <div className="card__picture-overlay">&nbsp;</div>
          <Image
            alt="The Sea Explorer"
            className="card__picture-img"
            layout="fill"
            objectFit="cover"
            src={
              photoPreview
                ? photoPreview
                : `https://picsum.photos/330/220.webp?random=${generateNumberBetweenRange(
                    0,
                    20
                  )}`
            }
          />
        </CardPicture>
        {/* <HeadingTertirary>
          <span>{name}</span>
        </HeadingTertirary> */}
      </CardHeader>

      <CardDetails>
        <h6 className="text-sm pb-3">
          <span>{name}</span>
        </h6>
        {/* <h4 className="card__sub-heading">medium 7-day tour</h4> */}
        {/* <p className="card__text">
          Exploring the jaw-dropping US east coast by foot and by boat
        </p> */}
        <div className="card__grid">
          <div className="card__data">
            <UsersIcon color="#55c57a" height={20} width={20} />
            <span>1 - 3</span>
          </div>

          <div className="card__data">
            <ClockIcon color="#55c57a" height={20} width={20} />
            <span>{duration}-Day</span>
          </div>

          {location && (
            <div className="card__data">
              <MapPinIcon color="#55c57a" height={20} width={20} />
              <span>{location}</span>
            </div>
          )}
        </div>
      </CardDetails>

      <CardFooter>
        <p>
          <span className="card__footer-value">{price}</span>{" "}
          <span className="card__footer-text">/ person</span>
        </p>
        {rating && (
          <p className="card__ratings flex">
            <StarIcon
              className="mr-1"
              color="#ffc400"
              height={20}
              width={20}
            />
            <span className="card__footer-value mr-1"> 4.3</span>{" "}
            <span className="card__footer-text"> (7)</span>
          </p>
        )}
        {/* <CardButtonLink
          className="btn btn--green btn--small"
          href="/tour/the-sea-explorer"
        >
          Details
        </CardButtonLink> */}
      </CardFooter>
    </CardTourBase>
  );
};

export default CardTour;
