import { useQuery } from "@apollo/client";

import CardTour from "components/Organisms/Card/CardTour/CardTour";
import { optimizeImage } from "utils/Cloudinary";
import { formatRupiah } from "utils/Formatter";
import { Query, QueryToursArgs } from "gql/graphql";
import { DocumentNode } from "graphql";

interface SectionGridListTourProps {}

type QueryToursResponse = {
  tours: Query["tours"];
};

const QUERY_TOUR_CAROUSEL: DocumentNode = require("gql/tours/Query/CarouselTour.graphql");

const SectionGridListTour: React.FC<
  SectionGridListTourProps
> = () => {
  const { data, error, loading } = useQuery<
    QueryToursResponse,
    QueryToursArgs
  >(QUERY_TOUR_CAROUSEL, {
    variables: { pagination: { pageSize: 8 } },
  });

  if (error) return null;
  return (
    <div className="grid lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {data?.tours?.data.map((tour) => {
        const photoPreview = tour.attributes?.imagePreview?.data
          ? optimizeImage(
              tour.attributes?.imagePreview.data?.attributes?.url,
              {
                convert: { from: ".jpg", to: ".webp" },
                cropMode: "c_fill",
                size: { height: 440, width: 752 },
              }
            )
          : null;

        return (
          <CardTour
            key={tour.id}
            duration={tour.attributes?.duration}
            loading={loading}
            location={
              (tour.attributes?.provinces?.data ?? [])?.length > 0
                ? tour.attributes?.provinces?.data[0]?.attributes
                    ?.name
                : null
            }
            name={tour.attributes?.name}
            photoPreview={photoPreview}
            price={formatRupiah(tour.attributes?.price)}
          />
        );
      })}
    </div>
  );
};

export default SectionGridListTour;
