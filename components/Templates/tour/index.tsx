import { HTMLAttributes, useState } from "react";

import TemplatePageTourIndexBase from "./index.css";
import CheckBox from "components/Molecules/Input/CheckBox";
import MultiRangeSlider from "components/Molecules/Input/MultiRangeSlider";
import { AdjustmentsHorizontalIcon } from "@heroicons/react/24/outline";
import SectionGridListTour from "components/Organisms/Section/tour/SectionGridListTour";
import Filter from "components/Molecules/Filter/Filter";

interface TemplatePageTourIndexProps
  extends HTMLAttributes<HTMLDivElement> {}

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
  }>({
    filter: {
      rangePrice: {
        inputEnd: 10000000,

        inputStart: 0,
      },
    },
  });
  return (
    <TemplatePageTourIndexBase>
      <div className="container mx-auto px-4 xl:px-4">
        <div className="grid grid-cols-[minmax(0,_320px)_1fr] gap-4 items-start">
          <Filter />

          <SectionGridListTour />
        </div>
      </div>
    </TemplatePageTourIndexBase>
  );
};

export default TemplatePageTourIndex;
