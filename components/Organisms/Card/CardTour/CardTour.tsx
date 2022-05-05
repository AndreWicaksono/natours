import React, { HTMLAttributes } from "react";
import Image from "next/image";

import CardTourBase, { CardDetails, CardFooter } from "./CardTour.css";
import {
  ClockIcon,
  LocationMarkerIcon,
  StarIcon,
} from "@heroicons/react/outline";

interface ICardTourProps extends HTMLAttributes<HTMLDivElement> {
  duration: number;
  location: string;
  name: string;
  photoPreview?: string;
  price: string;
  rating?: number;
}

const CardTour: React.FC<ICardTourProps> = ({
  duration,
  location,
  name,
  photoPreview,
  price,
  rating,
}) => {
  return (
    <CardTourBase>
      <div className="card__header">
        <div className="card__picture">
          <div className="card__picture-overlay">&nbsp;</div>
          <Image
            alt="The Sea Explorer"
            className="card__picture-img"
            layout="fill"
            objectFit="cover"
            src={
              photoPreview
                ? photoPreview
                : "https://placeimg.com/330/220/nature"
            }
          />
        </div>
        <h3 className="heading-tertirary">
          <span>{name}</span>
        </h3>
      </div>

      <CardDetails>
        {/* <h4 className="card__sub-heading">medium 7-day tour</h4> */}
        {/* <p className="card__text">
          Exploring the jaw-dropping US east coast by foot and by boat
        </p> */}
        <div className="card__data">
          <LocationMarkerIcon color="#55c57a" height={20} width={20} />
          <span>{location}</span>
        </div>
        <div className="card__data">
          <ClockIcon color="#55c57a" height={20} width={20} />
          <span>{duration}-Day</span>
        </div>
      </CardDetails>

      <CardFooter>
        <p>
          <span className="card__footer-value">{price}</span>{" "}
          <span className="card__footer-text">per person</span>
        </p>
        {rating && (
          <p className="card__ratings flex">
            <StarIcon className="mr-1" color="#ffc400" height={20} width={20} />
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
