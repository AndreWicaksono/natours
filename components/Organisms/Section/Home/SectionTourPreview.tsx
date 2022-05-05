import React, { HTMLAttributes } from "react";

import CarouselTour from "components/Organisms/Carousel/CarouselTour/CarouselTour";

const SectionTourPreview: React.FC<HTMLAttributes<HTMLElement>> = ({
  className,
}) => {
  return (
    <section className={className}>
      <div className="container mx-auto px-4 xl:px-0">
        <h5 className="heading-green pb-4">Explore Our Tours</h5>
        <CarouselTour />
      </div>
    </section>
  );
};

export default SectionTourPreview;
