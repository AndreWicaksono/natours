import React, { HTMLAttributes, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";

import "swiper/css";
import "swiper/css/free-mode";
import "swiper/css/navigation";
import "swiper/css/thumbs";

import { FreeMode, Navigation, Thumbs } from "swiper";
import CarouselSimpleGalleryBase from "./CarouselSimpleGallery.css";

interface ICarouselSimpleGalleryProps extends HTMLAttributes<HTMLDivElement> {}

const CarouselSimpleGallery: React.FC<ICarouselSimpleGalleryProps> = () => {
  const [thumbsSwiper, setThumbsSwiper] = useState<any>(null);

  return (
    <CarouselSimpleGalleryBase>
      <Swiper
        loop={true}
        spaceBetween={10}
        navigation={true}
        thumbs={{ swiper: thumbsSwiper }}
        modules={[FreeMode, Navigation, Thumbs]}
        className="mySwiper2"
      >
        {Array.from(Array(10).keys()).map((el) => (
          <SwiperSlide key={el}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt="Tour's Photo"
              src={`https://swiperjs.com/demos/images/nature-${el + 1}.jpg`}
            />
          </SwiperSlide>
        ))}
      </Swiper>

      <Swiper
        onSwiper={setThumbsSwiper}
        loop={true}
        spaceBetween={10}
        slidesPerView={10}
        freeMode={true}
        watchSlidesProgress={true}
        modules={[FreeMode, Navigation, Thumbs]}
        className="mySwiper hidden md:block"
      >
        {Array.from(Array(10).keys()).map((el) => (
          <SwiperSlide key={el}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt="Tour's Thumbnail"
              src={`https://swiperjs.com/demos/images/nature-${el + 1}.jpg`}
            />
          </SwiperSlide>
        ))}
      </Swiper>
    </CarouselSimpleGalleryBase>
  );
};

export default CarouselSimpleGallery;
