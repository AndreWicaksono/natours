import { HTMLAttributes, Key, useState } from "react";
import Link from "next/link";

import { DocumentNode, useQuery } from "@apollo/client";

import CardTour from "components/Molecules/Card/CardTour/CardTour";
import { CardLinkWrapper } from "components/Molecules/Card/CardTour/CardTour.css";
import {
  TypeObjectFilter_TourListing,
  initialFilterState,
} from "components/Organisms/Filter/FilterListingTour/FilterListingTour";
import Listing from "components/Organisms/Listing/Listing";

import { Query, QueryToursArgs } from "gql/graphql";

import { optimizeImage } from "utils/Cloudinary";
import { formatRupiah } from "utils/Formatter";

import TemplatePageTourIndexBase from "./index.css";

interface TemplatePageTourIndexProps
  extends HTMLAttributes<HTMLDivElement> {}

export type QueryToursResponse = {
  tours: Query["tours"];
};

const QUERY_TOUR_CAROUSEL: DocumentNode = require("gql/tours/Query/CarouselTour.graphql");

const TemplatePageTourIndex: React.FC<
  TemplatePageTourIndexProps
> = () => {
  const [queryVariables, setQueryVariables] = useState<{
    filter: TypeObjectFilter_TourListing;
    pageActive: number;
  }>({
    filter: initialFilterState,
    pageActive: 1,
  });

  const { data, error, loading } = useQuery<
    QueryToursResponse,
    QueryToursArgs
  >(QUERY_TOUR_CAROUSEL, {
    variables: { pagination: { pageSize: 8 } },
  });

  const listTour: Array<{
    id: Key;
    duration: number | null | undefined;
    location: string | null | undefined;
    name: string | undefined;
    photoPreview?: string | null;
    price: string;
    rating?: number;
    slug: string;
  }> = (data?.tours?.data ?? []).map((tour) => {
    return {
      id: tour?.id ? tour.id.toString() : "",
      duration: tour.attributes?.duration,
      location:
        (tour.attributes?.provinces?.data ?? [])?.length > 0
          ? tour.attributes?.provinces?.data[0]?.attributes?.name
          : null,

      name: tour.attributes?.name,
      photoPreview: tour?.attributes?.imagePreview
        ? tour.attributes?.imagePreview.data?.attributes?.url
        : null,
      price: formatRupiah(tour.attributes?.price),
      slug: tour.attributes?.slug ?? "",
      rating: 0,
    };
  });

  if (loading) return null;
  if (error) return null;

  return (
    <TemplatePageTourIndexBase>
      <div className="container mx-auto px-4 xl:px-4 pt-4 pb-10">
        <Listing
          appliedFilter={queryVariables.filter}
          onFilterApplied={(e, stateToBeApplied) =>
            setQueryVariables((prevState) => {
              return {
                ...prevState,
                filter: stateToBeApplied,
              };
            })
          }
          pagination={{
            resultDisplayedEnd: 8,
            resultDisplayedStart: 1,
            resultTotal: 97,
            onClick: (e) =>
              setQueryVariables((prevState) => {
                return {
                  ...prevState,
                  pageActive: Number(e.currentTarget.value),
                };
              }),

            pageActive: queryVariables.pageActive,
            pageTotal: 10,
          }}
        >
          {listTour?.map((tour) => {
            const photoPreview = tour.photoPreview
              ? optimizeImage(tour.photoPreview, {
                  convert: { from: ".jpg", to: ".webp" },
                  cropMode: "c_fill",
                  size: { height: 440, width: 752 },
                })
              : null;

            return (
              <div className="relative" key={tour.id}>
                {!loading && (
                  <Link
                    href={`/tour/${tour?.slug}`}
                    passHref
                    prefetch={false}
                  >
                    <CardLinkWrapper className="absolute" />
                  </Link>
                )}

                <CardTour
                  className="min-h-full"
                  duration={tour.duration}
                  loading={loading}
                  location={tour.location}
                  name={tour.name}
                  photoPreview={photoPreview}
                  price={tour.price}
                />
              </div>
            );
          })}
        </Listing>
      </div>
    </TemplatePageTourIndexBase>
  );
};

export default TemplatePageTourIndex;
