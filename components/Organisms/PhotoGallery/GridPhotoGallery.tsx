import React, { HTMLAttributes } from "react";

import Image from "next/image";

import ModalPhotoGallery from "../Modal/ModalPhotoGallery/ModalPhotoGallery";

import GridPhotoGalleryBase, {
  ButtonViewGalleryFloat,
  PhotoGridFourSquares,
  PhotoGridThreeSquares,
  PhotoGridTwoSquares,
} from "./GridPhotoGallery.css";

interface IGridPhotoGalleryProps extends HTMLAttributes<HTMLDivElement> {
  data: Array<{ id: string | number; urlImage: string }>;
}

const GridPhotoGallery: React.FC<IGridPhotoGalleryProps> = ({
  className,
  data,
}) => {
  return (
    <GridPhotoGalleryBase className={className}>
      {data.length === 1 && (
        <div className="relative h-full">
          {data.map((image) => {
            return (
              <Image
                alt="Tour Preview Image"
                className="rounded"
                key={image.id}
                layout="fill"
                objectFit="cover"
                src={image.urlImage}
              />
            );
          })}
        </div>
      )}

      {data.length === 2 && (
        <PhotoGridTwoSquares>
          {data.map((image) => {
            return (
              <div className="relative" key={image.id}>
                <Image
                  alt="Tour Preview Image"
                  layout="fill"
                  objectFit="cover"
                  src={image.urlImage}
                />
              </div>
            );
          })}
        </PhotoGridTwoSquares>
      )}

      {data.length === 3 && (
        <PhotoGridThreeSquares>
          {data.map((image) => {
            return (
              <div className="relative" key={image.id}>
                <Image
                  alt="Tour Preview Image"
                  layout="fill"
                  objectFit="cover"
                  src={image.urlImage}
                />
              </div>
            );
          })}
        </PhotoGridThreeSquares>
      )}

      {data.length === 4 && (
        <PhotoGridFourSquares rootContainer>
          {data.map((image) => {
            return (
              <div className="relative" key={image.id}>
                <Image
                  alt="Tour Preview Image"
                  layout="fill"
                  objectFit="cover"
                  src={image.urlImage}
                />
              </div>
            );
          })}
        </PhotoGridFourSquares>
      )}

      {data.length > 4 && (
        <PhotoGridTwoSquares hasChildrenGrid key={data[0].id}>
          <div className="relative">
            <Image
              alt="Tour Preview Image"
              layout="fill"
              objectFit="cover"
              src={data[0].urlImage}
            />
          </div>

          <PhotoGridFourSquares>
            {data.map((image, index) => {
              if (index >= 1) {
                return (
                  <div className="relative" key={image.id}>
                    <Image
                      alt="Tour Preview Image"
                      layout="fill"
                      objectFit="cover"
                      src={image.urlImage}
                    />
                  </div>
                );
              }
            })}
          </PhotoGridFourSquares>
        </PhotoGridTwoSquares>
      )}

      <ModalPhotoGallery Button={ButtonViewGalleryFloat} />
    </GridPhotoGalleryBase>
  );
};

export default GridPhotoGallery;
