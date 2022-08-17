import React from "react";

import SectionPhotoGallery from "components/Organisms/Section/tour/SectionPhotoGallery";

import useWindowSize from "utils/Hooks/useWindowSize";

import PageTourDetailBase from "./PageTourDetail.css";

const PageTourDetail = () => {
  const sectionPhotoGallery = <SectionPhotoGallery />;

  const { width } = useWindowSize();

  return (
    <PageTourDetailBase>
      <header>
        {width >= 744 ? (
          <div className="container mx-auto">
            <h4 className="capitalize pb-1 text-2xl font-semibold">
              Pangandaran Private Tour
            </h4>
            <p className="pb-4 text-sm">Pangandaran, Jawa Barat</p>

            {sectionPhotoGallery}
          </div>
        ) : (
          sectionPhotoGallery
        )}
      </header>
    </PageTourDetailBase>
  );
};

export default PageTourDetail;
