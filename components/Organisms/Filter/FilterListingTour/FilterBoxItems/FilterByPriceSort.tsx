import {
  Dispatch,
  Fragment,
  MouseEventHandler,
  SetStateAction,
} from "react";

import { ClockIcon } from "@heroicons/react/24/outline";

import {
  initialFilterState,
  TypeObjectFilter_TourListing,
} from "components/Organisms/Filter/FilterListingTour/FilterListingTour";

const FilterByPriceSort: React.FC<{
  onResetToLastSaved: MouseEventHandler<HTMLButtonElement>;
  setState: Dispatch<SetStateAction<TypeObjectFilter_TourListing>>;
  state: TypeObjectFilter_TourListing;
}> = ({ onResetToLastSaved, state, setState }) => {
  return (
    <Fragment>
      <ul className="grid max-w-full w-full grid-cols-3 gap-x-2">
        <li className="">
          <input
            className="peer sr-only"
            type="radio"
            value="price:asc"
            name="price:asc"
            id="price:asc"
            checked={state.sort === "price:asc"}
            onClick={(e) => {
              setState((prevState) => {
                return {
                  ...prevState,
                  sort:
                    prevState.sort === "price:asc"
                      ? "none"
                      : "price:asc",
                };
              });
            }}
            readOnly
          />
          <label
            className="flex justify-center cursor-pointer rounded-lg border border-gray-300 bg-white py-1 px-1 hover:bg-gray-50 focus:outline-none peer-checked:border-transparent peer-checked:ring-1 peer-checked:ring-[#55c57a] transition-all duration-300 ease-in-out text-sm"
            htmlFor="price:asc"
          >
            Highest
          </label>
        </li>

        <li className="">
          <input
            className="peer sr-only"
            type="radio"
            value={"price:desc"}
            name="answer"
            id="price:desc"
            checked={state.sort === "price:desc"}
            onClick={(e) => {
              setState((prevState) => {
                return {
                  ...prevState,
                  sort:
                    prevState.sort === "price:desc"
                      ? "none"
                      : "price:desc",
                };
              });
            }}
            readOnly
          />
          <label
            className="flex justify-center cursor-pointer rounded-lg border border-gray-300 bg-white py-1 px-1 hover:bg-gray-50 focus:outline-none peer-checked:border-transparent peer-checked:ring-1 peer-checked:ring-[#55c57a] transition-all duration-300 ease-in-out text-sm"
            htmlFor="price:desc"
          >
            Cheapest
          </label>
        </li>
      </ul>

      <div className="flex space-x-3 pt-2">
        <button
          type="button"
          className="inline-flex items-center space-x-1 text-xs text-gray-500 underline"
          onClick={onResetToLastSaved}
        >
          <ClockIcon height={14} width={14} />
          <span>Last saved Sort</span>
        </button>

        <button
          type="button"
          className="inline-flex items-center space-x-1 text-xs text-gray-500 underline"
          onClick={() =>
            setState((prevState) => {
              return {
                ...prevState,
                sort: initialFilterState.sort,
              };
            })
          }
        >
          <span>Clear</span>
        </button>
      </div>
    </Fragment>
  );
};

export default FilterByPriceSort;
