import React, { HTMLAttributes } from "react";

import { useQuery } from "@apollo/client";

import CarouselTour from "components/Organisms/Carousel/CarouselTour/CarouselTour";

import { CarouselToursQuery, CarouselToursQueryVariables } from "graphql";
import { SwiperSlide } from "swiper/react";
import CardTour from "components/Organisms/Card/CardTour/CardTour";
import { formatRupiah } from "utils/Formatter";

const QUERY_TOUR_CAROUSEL = require("graphql/tours/Query/CarouselTour.graphql");

const SectionTourPreview: React.FC<HTMLAttributes<HTMLElement>> = ({
  className,
}) => {
  const { data, error, loading } = useQuery<
    CarouselToursQuery,
    CarouselToursQueryVariables
  >(QUERY_TOUR_CAROUSEL);

  if (error) return null;

  return (
    <section className={className}>
      <div className="container mx-auto px-4 xl:px-0">
        <h5 className="heading-green pb-4">Explore Our Tours</h5>
        <CarouselTour
          loading={loading}
          slides={data?.tours?.data.map((tour) => {
            const photoPreview =
              tour.attributes?.imagePreview.data?.attributes?.url;

            return (
              <SwiperSlide key={tour.id}>
                <CardTour
                  duration={tour.attributes?.duration}
                  loading={loading}
                  location={`${tour.attributes?.city}, ${tour.attributes?.province}`}
                  name={tour.attributes?.name}
                  photoPreview={
                    photoPreview ? `http://localhost:1337${photoPreview}` : null
                  }
                  price={formatRupiah(tour.attributes?.price)}
                />
              </SwiperSlide>
            );
          })}
        />
      </div>
    </section>
  );
};

export default SectionTourPreview;
