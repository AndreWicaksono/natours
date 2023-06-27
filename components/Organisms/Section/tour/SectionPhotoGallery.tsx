import React from "react";

import GridPhotoGallery from "components/Organisms/PhotoGallery/GridPhotoGallery";

import useWindowSize from "utils/Hooks/useWindowSize";
import MobilePhotoGallery from "components/Organisms/PhotoGallery/MobilePhotoGallery";

const SectionPhotoGallery: React.FC = () => {
  const { width } = useWindowSize();

  const data = [
    {
      id: 1,
      urlImage: "https://picsum.photos/1200/900.webp?random=1",
    },
    {
      id: 2,
      urlImage: "https://picsum.photos/1200/900.webp?random=2",
    },
    {
      id: 3,
      urlImage: "https://picsum.photos/1200/900.webp?random=3",
    },
    {
      id: 4,
      urlImage: "https://picsum.photos/1200/900.webp?random=4",
    },
    {
      id: 5,
      urlImage: "https://picsum.photos/1200/900.webp?random=5",
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
