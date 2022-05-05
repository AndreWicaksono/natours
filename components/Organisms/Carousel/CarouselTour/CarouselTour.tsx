import React, { HTMLAttributes, useState } from "react";

import CardTour from "components/Organisms/Card/CardTour/CardTour";

import useWindowSize from "utils/Hooks/useWindowSize";

import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/solid";
import { Pagination, Navigation } from "swiper";
import { Swiper, SwiperSlide, useSwiper } from "swiper/react";

import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";

import CarouselTourBase, {
  CustomButtonNext,
  CustomButtonPrevious,
} from "./CarouselTour.css";

const CarouselTour: React.FC<HTMLAttributes<HTMLDivElement>> = ({
  className,
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
      onMouseOver={() => width >= 1024 && setHovered(true)}
      onMouseLeave={() => width >= 1024 && setHovered(false)}
    >
      <Swiper
        className="mySwiper"
        modules={[Pagination, Navigation]}
        navigation={true}
        pagination={{
          clickable: true,
        }}
        spaceBetween={16}
        slidesPerGroup={1}
        slidesPerView={1}
        breakpoints={{
          768: { slidesPerView: 2, slidesPerGroup: 2 },
          1024: { slidesPerGroup: 3, slidesPerView: 3, touchRatio: 0 },
          1208: { slidesPerGroup: 4, slidesPerView: 4, touchRatio: 0 },
        }}
      >
        <SwiperSlide>
          <CardTour
            duration={1}
            location="Sleman, Daerah Istimewa Yogyakarta"
            name="Yogya Istimewa"
            price="Rp300.000"
          />
        </SwiperSlide>
        <SwiperSlide>
          <CardTour
            duration={1}
            location="Sleman, Daerah Istimewa Yogyakarta"
            name="Yogya Istimewa"
            price="Rp300.000"
          />
        </SwiperSlide>
        <SwiperSlide>
          <CardTour
            duration={1}
            location="Sleman, Daerah Istimewa Yogyakarta"
            name="Yogya Istimewa"
            price="Rp300.000"
          />
        </SwiperSlide>
        <SwiperSlide>
          <CardTour
            duration={1}
            location="Sleman, Daerah Istimewa Yogyakarta"
            name="Yogya Istimewa"
            price="Rp300.000"
          />
        </SwiperSlide>
        <SwiperSlide>
          <CardTour
            duration={1}
            location="Sleman, Daerah Istimewa Yogyakarta"
            name="Yogya Istimewa"
            price="Rp300.000"
          />
        </SwiperSlide>
        <SwiperSlide>
          <CardTour
            duration={1}
            location="Sleman, Daerah Istimewa Yogyakarta"
            name="Yogya Istimewa"
            price="Rp300.000"
          />
        </SwiperSlide>
        <SwiperSlide>
          <CardTour
            duration={1}
            location="Sleman, Daerah Istimewa Yogyakarta"
            name="Yogya Istimewa"
            price="Rp300.000"
          />
        </SwiperSlide>
        <SwiperSlide>
          <CardTour
            duration={1}
            location="Sleman, Daerah Istimewa Yogyakarta"
            name="Yogya Istimewa"
            price="Rp300.000"
          />
        </SwiperSlide>
        <SwiperSlide>
          <CardTour
            duration={1}
            location="Sleman, Daerah Istimewa Yogyakarta"
            name="Yogya Istimewa"
            price="Rp300.000"
          />
        </SwiperSlide>

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
