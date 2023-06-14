import React from "react";

import { BanknotesIcon } from "@heroicons/react/20/solid";

import Rating from "components/Molecules/Rating/Rating";
import Footer from "components/Organisms/Footer/Footer";
import ProductOverview from "components/Organisms/ProductOverview/ProductOverview";
import SectionPhotoGallery from "components/Organisms/Section/tour/SectionPhotoGallery";

import useWindowSize from "utils/Hooks/useWindowSize";

import PageTourDetailBase from "./PageTourDetail.css";

const PageTourDetail = () => {
  const sectionPhotoGallery = <SectionPhotoGallery />;

  const { width } = useWindowSize();

  return (
    <PageTourDetailBase className="relative">
      <header>
        {width >= 744 ? (
          <div className="container mx-auto">{sectionPhotoGallery}</div>
        ) : (
          sectionPhotoGallery
        )}
      </header>

      <div className="container mx-auto">
        <ProductOverview />
      </div>

      <div
        className="sticky lg:hidden w-full z-30 bg-white border-t border-black-700 p-4"
        style={{
          boxShadow: "0px 0px 0px #e5e7eb, 0px -8px 24px #e5e7eb",
          bottom: 0,
        }}
      >
        <div className="flex items-center justify-between">
          <div className="grow pr-2">
            <p className="pb-1 text-xl md:text-2xl tracking-tight text-gray-900">
              Rp1.900.000
            </p>

            <Rating
              className="grid grid-cols-[repeat(auto-fit,_100px)] gap-x-2 gap-y-1"
              totalReview={2}
              value={4.7}
            />
          </div>

          <button
            type="submit"
            className="group relative mb-2 flex justify-center rounded-sm border border-transparent bg-gradient-natours py-2 px-4 text-sm font-medium text-white hover:bg-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          >
            <span className="pr-3">
              <BanknotesIcon
                className="h-5 w-5 text-white group-hover:text-white"
                aria-hidden="true"
                height={16}
                width={16}
              />
            </span>

            <span>Pesan</span>
          </button>
        </div>
      </div>
      <Footer />
    </PageTourDetailBase>
  );
};

export default PageTourDetail;
