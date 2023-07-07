import {
  Dispatch,
  Fragment,
  MouseEventHandler,
  SetStateAction,
} from "react";

import { ClockIcon } from "@heroicons/react/24/outline";

import MultiRangeSlider from "components/Molecules/Input/MultiRangeSlider";
import {
  initialFilterState,
  TypeObjectFilter_TourListing,
} from "components/Organisms/Filter/FilterListingTour/FilterListingTour";

const FilterByPriceRange: React.FC<{
  onResetToLastSaved: MouseEventHandler<HTMLButtonElement>;
  setState: Dispatch<SetStateAction<TypeObjectFilter_TourListing>>;
  state: TypeObjectFilter_TourListing;
}> = ({ onResetToLastSaved, state, setState }) => {
  return (
    <Fragment>
      <MultiRangeSlider
        inputEnd={{
          type: "range",
          step: 25000,
          min: 0,
          max: 10000000,
          value: state.price.end,
          id: "slider-2",
          onInput: (e) => {
            const value: number = Number(e?.currentTarget?.value);

            if (value >= state.price.start) {
              setState((prevState) => {
                return {
                  ...prevState,
                  price: {
                    ...prevState.price,
                    end: value,
                  },
                };
              });
            }
          },
        }}
        inputStart={{
          type: "range",
          step: 25000,
          min: 0,
          max: 10000000,
          value: state.price.start,
          id: "slider-1",
          onInput: (e) => {
            const value: number = Number(e?.currentTarget?.value);

            if (value <= state.price.end) {
              setState((prevState) => {
                return {
                  ...prevState,
                  price: {
                    ...prevState.price,
                    start: value,
                  },
                };
              });
            }
          },
        }}
        onInputTextEndChange={(e) => {
          let value: number = Number(e?.target?.value);

          const price = {
            end: state.price.end,
            start: state.price.start,
          };

          if (value < state.price.start) {
            price.end = state.price.start;
          } else if (value > 10000000) {
            price.end = 10000000;
          } else {
            price.end = value;
          }

          setState((prevState) => {
            return {
              ...prevState,
              price: {
                end: price.end,
                start: price.start,
              },
            };
          });
        }}
        onInputTextStartChange={(e) => {
          let value: number = Number(e?.target?.value);

          const price = {
            end: state.price.end,
            start: state.price.start,
          };

          if (value > state.price.end) {
            price.start = state.price.end;
          } else if (value > 10000000) {
            price.start = 10000000;
          } else {
            price.start = value;
          }

          setState((prevState) => {
            return {
              ...prevState,
              price: {
                end: price.end,

                start: price.start,
              },
            };
          });
        }}
      />

      <div className="space-y-2 py-6">
        <div className="flex space-x-3 pt-2">
          <button
            type="button"
            className="inline-flex space-x-1 text-xs text-gray-500 underline"
            onClick={onResetToLastSaved}
          >
            <ClockIcon height={14} width={14} />
            <span>Last saved Price</span>
          </button>

          <button
            type="button"
            className="inline-flex items-center space-x-1 text-xs text-gray-500 underline"
            onClick={() =>
              setState((prevState) => {
                return {
                  ...prevState,
                  price: initialFilterState.price,
                };
              })
            }
          >
            <span>Clear</span>
          </button>
        </div>
      </div>
    </Fragment>
  );
};

export default FilterByPriceRange;
