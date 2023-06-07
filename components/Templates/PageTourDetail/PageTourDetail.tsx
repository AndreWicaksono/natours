import React from "react";

import Footer from "components/Organisms/Footer/Footer";
import ProductOverview from "components/Organisms/ProductOverview/ProductOverview";
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
          <div className="container mx-auto">{sectionPhotoGallery}</div>
        ) : (
          sectionPhotoGallery
        )}
      </header>

      <div className="container mx-auto">
        <ProductOverview />
      </div>
      <Footer />
    </PageTourDetailBase>
  );
};

export default PageTourDetail;
