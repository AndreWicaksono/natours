import React, { HTMLAttributes, useEffect } from "react";
import styled from "@emotion/styled";
import { StarIcon } from "@heroicons/react/20/solid";

const Rating: React.FC<
  HTMLAttributes<HTMLDivElement> & { totalReview?: number; value: number }
> = ({ totalReview = 0, value = 0, ...props }) => {
  const ratingOneDigitDecimal: number = Number(
    (Math.round(value * 100) / 100).toFixed(1)
  );

  const starFullfilled: number = Number(
    ratingOneDigitDecimal.toString().split(".")[0]
  );

  const numberDecimalPart: number = Number(
    ratingOneDigitDecimal.toString().split(".")[1] ?? 0
  );

  const percentageFilledOfLastStar: number = numberDecimalPart * 10;

  const cssClipPathPercentageValue = percentageFilledOfLastStar;

  const renderRatingStars = (): React.ReactNode => {
    const elementsRatingStar = [];

    for (let indexStarIcon = 0; indexStarIcon < 5; indexStarIcon++) {
      if (indexStarIcon === starFullfilled) {
        elementsRatingStar.push(
          <RatingStarIconCanvas key={`rating-star-${indexStarIcon}`}>
            <StarIcon height={20} width={20} fill="#55c57a" />
            <StarIcon
              className="fractional-value"
              height={20}
              width={20}
              fill="#e5e7eb"
              style={{
                clipPath: `inset(0 0 0 ${cssClipPathPercentageValue}%)`,
              }}
            />
          </RatingStarIconCanvas>
        );
      } else if (indexStarIcon <= starFullfilled) {
        elementsRatingStar.push(
          <RatingStarIconCanvas key={`rating-star-${indexStarIcon}`}>
            <StarIcon height={20} width={20} fill="#55c57a" />
          </RatingStarIconCanvas>
        );
      } else {
        elementsRatingStar.push(
          <RatingStarIconCanvas key={`rating-star-${indexStarIcon}`}>
            <StarIcon height={20} width={20} fill="#e5e7eb" />
          </RatingStarIconCanvas>
        );
      }
    }

    return elementsRatingStar.map((element) => element);
  };

  return (
    <RatingBase {...props}>
      <div className="flex">{renderRatingStars()} </div>
      <div className="inline-flex gap-x-1">
        <span className="text-sm font-medium text-gray-600">
          ({ratingOneDigitDecimal})
        </span>
        <p className="sr-only">{value} out of 5 stars</p>
        <a
          href={"#"}
          className="text-sm font-medium text-gray-600 hover:text-green-500 hover:underline hover:underline-offset-2"
        >
          {totalReview} ulasan
        </a>
      </div>
    </RatingBase>
  );
};

const RatingBase = styled.div`
  display: flex;
  align-items: center;
`;

const RatingStarIconCanvas = styled.button`
  position: relative;

  .fractional-value {
    position: absolute;
    top: 0;
    z-index: 1;
  }
`;

export default Rating;
