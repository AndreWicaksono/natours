import {
  ButtonHTMLAttributes,
  HTMLAttributes,
  Key,
  useState,
} from "react";
import Link from "next/link";

import { DocumentNode, useQuery } from "@apollo/client";
import { AdjustmentsHorizontalIcon } from "@heroicons/react/24/outline";

import CardTour from "components/Molecules/Card/CardTour/CardTour";
import { CardLinkWrapper } from "components/Molecules/Card/CardTour/CardTour.css";
import Filter from "components/Molecules/Filter/Filter";
import Modal from "components/Molecules/Modal/Modal";
import Pagination from "components/Molecules/Pagination/Pagination";

import { Query, QueryToursArgs } from "gql/graphql";

import { optimizeImage } from "utils/Cloudinary";
import { formatRupiah } from "utils/Formatter";
import useWindowSize from "utils/Hooks/useWindowSize";

import TemplatePageTourIndexBase from "./index.css";
import Listing from "components/Organisms/Listing/Listing";

interface TemplatePageTourIndexProps
  extends HTMLAttributes<HTMLDivElement> {}

export type QueryToursResponse = {
  tours: Query["tours"];
};

const ButtonModal: React.FC<
  ButtonHTMLAttributes<HTMLButtonElement>
> = (props) => <button {...props}>{props.children}</button>;

const QUERY_TOUR_CAROUSEL: DocumentNode = require("gql/tours/Query/CarouselTour.graphql");

const TemplatePageTourIndex: React.FC<
  TemplatePageTourIndexProps
> = () => {
  const [state, setState] = useState<{
    filter: {
      rangePrice: {
        inputEnd: number;
        inputStart: number;
      };
    };
    pageActive: number;
  }>({
    filter: {
      rangePrice: {
        inputEnd: 10000000,

        inputStart: 0,
      },
    },
    pageActive: 1,
  });

  const { data, error, loading } = useQuery<
    QueryToursResponse,
    QueryToursArgs
  >(QUERY_TOUR_CAROUSEL, {
    variables: { pagination: { pageSize: 8 } },
  });

  const { width } = useWindowSize();

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

  if (!width) return null;

  return (
    <TemplatePageTourIndexBase>
      <div className="container mx-auto px-4 xl:px-4 pt-4 pb-10">
        <Listing
          pagination={{
            resultDisplayedEnd: 8,
            resultDisplayedStart: 1,
            resultTotal: 97,
            onClick: (e) =>
              setState((prevState) => {
                return {
                  ...prevState,
                  pageActive: Number(e.currentTarget.value),
                };
              }),

            pageActive: state.pageActive,
            pageTotal: 10,
          }}
        >
          {!error &&
            listTour?.map((tour) => {
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
        {/* <div className="flex justify-between pb-4">
          <h5>All Tours</h5>

          {width < 1208 && (
            <Modal
              buttonModal={(propsButtonModal) => (
                <ButtonModal
                  className="fixed sm:relative translate-x-[50%] sm:translate-x-0 translate-y-[-50%] sm:translate-y-0 right-2/4 sm:right-auto bottom-6 sm:bottom-auto z-10 bg-white xl:hidden flex items-center space-x-2 rounded-md border border-gray-200 shadow-md md:bg-opacity-20 px-4 py-2 text-sm font-medium hover:bg-opacity-30 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75"
                  type="button"
                  {...propsButtonModal}
                >
                  <span>
                    <AdjustmentsHorizontalIcon
                      height={20}
                      width={20}
                    />
                  </span>
                  <span>Filters</span>
                </ButtonModal>
              )}
              classNamePanel="h-screen sm:h-auto relative w-full max-w-md transform overflow-hidden sm:rounded-lg bg-white text-left align-middle transition-all"
              closeIconClassName="absolute inline-block right-2 top-2 m-auto"
            >
              <Filter className="overflow-x-hidden overflow-y-scroll text-gray-700" />
            </Modal>
          )}
        </div>

        <div className="grid lg:grid-cols-1 xl:grid-cols-[minmax(0,_320px)_1fr] gap-4 items-start pb-8">
          {width >= 1208 && (
            <Filter className="hidden xl:grid xl:max-w-xs xl:w-screen xl:sticky xl:top-[96px] overflow-hidden rounded-lg border border-gray-200 shadow-lg text-gray-700" />
          )}

          <div className="space-y-8">
            <div className="grid sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {!error &&
                listTour?.map((tour) => {
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
            </div>

            {width >= 1024 && (
              <Pagination
                label={{
                  resultDisplayedEnd: 8,
                  resultDisplayedStart: 1,
                  resultTotal: 97,
                }}
                onClickPagination={(e) =>
                  setState((prevState) => {
                    return {
                      ...prevState,
                      pageActive: Number(e.currentTarget.value),
                    };
                  })
                }
                pageActive={state.pageActive}
                pageTotal={10}
              />
            )}
          </div>
        </div>

        {width < 1024 && (
          <button className="w-full mb-6 xl:hidden space-x-2 rounded-md border border-gray-200 shadow-xs px-4 py-2 text-sm font-medium hover:bg-opacity-30 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75">
            Load More
          </button>
        )} */}
      </div>
    </TemplatePageTourIndexBase>
  );
};

export default TemplatePageTourIndex;
