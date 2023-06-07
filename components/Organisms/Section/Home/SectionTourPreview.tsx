import React, { HTMLAttributes } from "react";

import { useQuery } from "@apollo/client";

import CarouselTour from "components/Organisms/Carousel/CarouselTour/CarouselTour";

import { CarouselToursQuery, CarouselToursQueryVariables } from "graphql";
import { SwiperSlide } from "swiper/react";
import CardTour from "components/Organisms/Card/CardTour/CardTour";
import { formatRupiah } from "utils/Formatter";
import Link from "next/link";
import { optimizeImage } from "utils/Cloudinary";

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
              optimizeImage(
                tour.attributes?.imagePreview.data?.attributes?.url,
                {
                  convert: { from: ".jpg", to: ".webp" },
                  cropMode: "c_fill",
                  size: { height: 440, width: 752 },
                }
              ) ?? null;

            return (
              <SwiperSlide key={tour.id}>
                <Link
                  href={`/tour/${tour.attributes?.slug}`}
                  passHref
                  prefetch={false}
                >
                  <a>
                    <CardTour
                      duration={tour.attributes?.duration}
                      loading={loading}
                      location={`${tour.attributes?.city}, ${tour.attributes?.province}`}
                      name={tour.attributes?.name}
                      photoPreview={photoPreview}
                      price={formatRupiah(tour.attributes?.price)}
                    />
                  </a>
                </Link>
              </SwiperSlide>
            );
          })}
        />
      </div>
    </section>
  );
};

export default SectionTourPreview;
