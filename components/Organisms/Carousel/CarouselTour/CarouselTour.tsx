import React, { HTMLAttributes, ReactNode, useState } from "react";

import useWindowSize from "utils/Hooks/useWindowSize";

import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/20/solid";
import { Navigation } from "swiper";
import { Swiper, useSwiper } from "swiper/react";

import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";

import CarouselTourBase, {
  CustomButtonNext,
  CustomButtonPrevious,
} from "./CarouselTour.css";

interface ICarouselTourProps extends HTMLAttributes<HTMLDivElement> {
  loading?: boolean;
  slides: ReactNode;
}

const CarouselTour: React.FC<ICarouselTourProps> = ({
  className,
  loading,
  slides,
}) => {
  const [showButton, setShowButton] = useState<{
    previous: boolean;
    next: boolean;
  }>({ previous: false, next: true });
  const [hovered, setHovered] = useState<boolean>(false);

  const { width } = useWindowSize();

  return (
    <CarouselTourBase
      className={className}
      onMouseOver={() => !loading && width >= 1024 && setHovered(true)}
      onMouseLeave={() => width >= 1024 && setHovered(false)}
    >
      <Swiper
        className="mySwiper"
        modules={[Navigation]}
        navigation={true}
        pagination={{
          clickable: true,
        }}
        spaceBetween={16}
        slidesPerGroup={1}
        slidesPerView={1.3}
        breakpoints={{
          768: { slidesPerView: 3, slidesPerGroup: 3 },
          1024: { slidesPerGroup: 4, slidesPerView: 4 },
          1208: { slidesPerGroup: 5, slidesPerView: 5, touchRatio: 0 },
        }}
      >
        {slides}

        {hovered && (
          <React.Fragment>
            {showButton.previous && (
              <SwiperButtonPrevious
                onFirstIndex={(isFirstIndex) => {
                  if (isFirstIndex && width >= 1024) {
                    setShowButton((previousState) => {
                      return {
                        ...previousState,
                        previous: false,
                      };
                    });
                  } else if (!isFirstIndex && width >= 1024) {
                    setShowButton((previousState) => {
                      return {
                        ...previousState,
                        previous: true,
                      };
                    });
                  }
                }}
                onLastIndex={(isLastIndex) => {
                  if (!isLastIndex && width >= 1024) {
                    setShowButton((previousState) => {
                      return {
                        ...previousState,
                        next: true,
                      };
                    });
                  }
                }}
              >
                <ChevronLeftIcon />
              </SwiperButtonPrevious>
            )}

            {showButton.next && (
              <SwiperButtonNext
                onFirstIndex={(isFirstIndex) => {
                  if (!isFirstIndex && width >= 1024) {
                    setShowButton((previousState) => {
                      return {
                        ...previousState,
                        previous: true,
                      };
                    });
                  }
                }}
                onLastIndex={(isLastIndex) => {
                  if (isLastIndex && width >= 1024) {
                    setShowButton((previousState) => {
                      return {
                        ...previousState,
                        next: false,
                      };
                    });
                  }
                }}
              >
                <ChevronRightIcon />
              </SwiperButtonNext>
            )}
          </React.Fragment>
        )}
      </Swiper>
    </CarouselTourBase>
  );
};

interface ISwiperButtonProps extends HTMLAttributes<HTMLButtonElement> {
  onFirstIndex?: (isFirstIndex: boolean) => void;
  onLastIndex?: (isLastIndex: boolean) => void;
}

const SwiperButtonNext: React.FC<ISwiperButtonProps> = ({
  children,
  onFirstIndex,
  onLastIndex,
}) => {
  const swiper = useSwiper();
  return (
    <CustomButtonNext
      onClick={() => {
        swiper.slideNext();

        onFirstIndex && onFirstIndex(swiper.isBeginning);
        onLastIndex && onLastIndex(swiper.isEnd);
      }}
    >
      {children}
    </CustomButtonNext>
  );
};
const SwiperButtonPrevious: React.FC<ISwiperButtonProps> = ({
  children,
  onFirstIndex,
  onLastIndex,
}) => {
  const swiper = useSwiper();
  return (
    <CustomButtonPrevious
      onClick={() => {
        swiper.slidePrev();

        onFirstIndex && onFirstIndex(swiper.isBeginning);
        onLastIndex && onLastIndex(swiper.isEnd);
      }}
    >
      {children}
    </CustomButtonPrevious>
  );
};

export default CarouselTour;
