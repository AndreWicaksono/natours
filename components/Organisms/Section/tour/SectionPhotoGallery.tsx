import React from "react";

import GridPhotoGallery from "components/Organisms/PhotoGallery/GridPhotoGallery";

import useWindowSize from "utils/Hooks/useWindowSize";
import MobilePhotoGallery from "components/Organisms/PhotoGallery/MobilePhotoGallery";

const SectionPhotoGallery: React.FC = () => {
  const { width } = useWindowSize();

  const data = [
    {
      id: 1,
      urlImage: "https://placeimg.com/1200/900/nature",
    },
    {
      id: 2,
      urlImage: "https://placeimg.com/1200/900/people",
    },
    {
      id: 3,
      urlImage: "https://placeimg.com/1200/900/tech",
    },
    {
      id: 4,
      urlImage: "https://placeimg.com/1200/900/arch",
    },
    {
      id: 5,
      urlImage: "https://placeimg.com/1200/900/nature/grayscale",
    },
  ];

  const renderPhotoGallery = (): React.ReactElement => {
    if (width >= 744) {
      return <GridPhotoGallery data={data} />;
    }

    return <MobilePhotoGallery data={data} />;
  };

  return <React.Fragment>{renderPhotoGallery()}</React.Fragment>;
};

export default SectionPhotoGallery;
