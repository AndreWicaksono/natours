import { Fragment, useState, MouseEvent } from "react";

import {
  ArrowsUpDownIcon,
  BanknotesIcon,
  MapPinIcon,
} from "@heroicons/react/20/solid";
import { ClockIcon } from "@heroicons/react/24/outline";

import FilterBox from "components/Molecules/Filter/FilterBox";
import FilterByPriceRange from "components/Organisms/Filter/FilterListingTour/FilterBoxItems/FilterByPriceRange";
import FilterByPriceSort from "components/Organisms/Filter/FilterListingTour/FilterBoxItems/FilterByPriceSort";
import FilterByProvinces from "components/Organisms/Filter/FilterListingTour/FilterBoxItems/FilterByProvinces";

export type TypeObjectFilter_TourListing = {
  price: {
    end: number;
    start: number;
  };
  provinces: Array<string>;
  sort: "price:asc" | "price:desc" | "none";
};

export const initialFilterState: TypeObjectFilter_TourListing = {
  price: {
    end: 10000000,
    start: 0,
  },
  provinces: [],
  sort: "none",
};

const FilterListingTour: React.FC<{
  appliedFilter: TypeObjectFilter_TourListing;
  onSave: (
    event: MouseEvent<HTMLButtonElement>,
    stateToBeApplied: TypeObjectFilter_TourListing
  ) => void;
}> = ({ appliedFilter, onSave }) => {
  const [draftFilter, setDraftFilter] =
    useState<TypeObjectFilter_TourListing>(appliedFilter);

  const dataFilterByProvinces: Array<{
    label: string;
    value: string;
  }> = [
    {
      label: "DKI Jakarta",
      value: "1",
    },
    {
      label: "Jawa Barat",
      value: "2",
    },
    {
      label: "Jawa Tengah",
      value: "3",
    },
    { label: "Daerah Istimewa Yogyakarta", value: "4" },
    { label: "Jawa Timur", value: "5" },
    { label: "Banten", value: "6" },
    { label: "Aceh", value: "7" },
    { label: "Sumatera Utara", value: "8" },
    { label: "Sumatera Barat", value: "9" },
  ]; // This data should be replaced with API query response

  return (
    <FilterBox
      button={{
        apply: {
          children: "Apply Filters",
          disabled:
            draftFilter.price.end === appliedFilter.price.end &&
            draftFilter.price.start === draftFilter.price.start &&
            draftFilter.sort === appliedFilter.sort &&
            draftFilter.provinces.length ==
              appliedFilter.provinces.length &&
            draftFilter.provinces.every((element) => {
              return appliedFilter.provinces.includes(element);
            }),
          name: "commit",
          type: "button",
          className:
            "disabled:bg-slate-300 disabled:bg-none rounded bg-blue-600 px-4 py-3 text-sm font-medium text-white enabled:active:scale-95 bg-gradient-natours",
          onClick: (e) => onSave(e, draftFilter),
        },
        resetAllToDefault: {
          children: "Clear All",
          name: "reset",
          type: "button",
          className:
            "rounded text-xs font-medium text-gray-600 underline",
          onClick: () => setDraftFilter(initialFilterState),
        },
        resetAllToLastSaved: {
          children: (
            <Fragment>
              <ClockIcon height={14} width={14} />
              <span>Last saved</span>
            </Fragment>
          ),
          name: "reset",
          type: "button",
          className:
            "inline-flex items-center rounded text-xs font-medium text-gray-600 underline space-x-1",
          onClick: () => setDraftFilter(appliedFilter),
        },
      }}
      filters={[
        {
          component: (
            <FilterByPriceSort
              onResetToLastSaved={() =>
                setDraftFilter((prevState) => {
                  return {
                    ...prevState,
                    sort: appliedFilter.sort,
                  };
                })
              }
              setState={setDraftFilter}
              state={draftFilter}
            />
          ),
          heading: "Sort",
          icon: <ArrowsUpDownIcon height={16} width={16} />,
        },
        {
          component: (
            <FilterByProvinces
              checkboxes={dataFilterByProvinces}
              onResetToLastSaved={() =>
                setDraftFilter((prevState) => {
                  return {
                    ...prevState,
                    provinces: appliedFilter.provinces,
                  };
                })
              }
              setState={setDraftFilter}
              state={draftFilter.provinces}
            />
          ),
          heading: "Provinces",
          icon: <MapPinIcon height={16} width={16} />,
        },
        {
          component: (
            <FilterByPriceRange
              onResetToLastSaved={() =>
                setDraftFilter((prevState) => {
                  return {
                    ...prevState,
                    price: appliedFilter.price,
                  };
                })
              }
              setState={setDraftFilter}
              state={draftFilter}
            />
          ),
          heading: "Price",
          icon: <BanknotesIcon height={16} width={16} />,
        },
      ]}
    />
  );
};

export default FilterListingTour;
