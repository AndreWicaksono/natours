import React from "react";
import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";

import "swiper/css";
import "swiper/css/pagination";

import { Pagination } from "swiper";

import MobilePhotoGalleryBase, {
  StylesButtonModalTriggerTransparent,
} from "./MobilePhotoGallery.css";
import ModalPhotoGallery from "../Modal/ModalPhotoGallery/ModalPhotoGallery";

interface IMobilePhotoGalleryProps
  extends React.HTMLAttributes<HTMLDivElement> {
  data: Array<{ id: string | number; urlImage: string }>;
}

const MobilePhotoGallery: React.FC<IMobilePhotoGalleryProps> = ({
  data,
  ...props
}) => {
  return (
    <MobilePhotoGalleryBase {...props}>
      <Swiper
        pagination={{
          dynamicBullets: true,
        }}
        modules={[Pagination]}
        className="mySwiper"
      >
        {data.map((image) => (
          <SwiperSlide key={image.id}>
            <Image
              alt="Tour Preview Image"
              key={image.id}
              layout="fill"
              objectFit="cover"
              src={image.urlImage}
            />
          </SwiperSlide>
        ))}
      </Swiper>

      <ModalPhotoGallery
        css={{
          button: StylesButtonModalTriggerTransparent,
        }}
      />
    </MobilePhotoGalleryBase>
  );
};

export default MobilePhotoGallery;
