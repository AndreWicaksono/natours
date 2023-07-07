import {
  ChangeEvent,
  Dispatch,
  Fragment,
  MouseEventHandler,
  ReactElement,
  SetStateAction,
} from "react";

import { ClockIcon } from "@heroicons/react/24/outline";

import CheckBox from "components/Molecules/Input/CheckBox";
import ComboBox from "components/Molecules/ComboBox/ComboBox";
import {
  initialFilterState,
  TypeObjectFilter_TourListing,
} from "components/Organisms/Filter/FilterListingTour/FilterListingTour";

const FilterByProvinces: React.FC<{
  checkboxes: Array<{ label: string; value: string }>;
  onResetToLastSaved: MouseEventHandler<HTMLButtonElement>;
  setState: Dispatch<SetStateAction<TypeObjectFilter_TourListing>>;
  state: TypeObjectFilter_TourListing["provinces"];
}> = ({
  checkboxes,
  onResetToLastSaved,
  state,
  setState,
}): ReactElement => {
  const handleCheckBoxes: (
    e: ChangeEvent<HTMLInputElement>
  ) => void = (e) => {
    setState((prevState) => {
      return {
        ...prevState,
        provinces: e.target.checked
          ? [...prevState.provinces, e.target.value]
          : [...prevState.provinces].filter(
              (item) => item !== e.target.value
            ),
      };
    });
  };

  return (
    <Fragment>
      <div className="pb-2 space-y-2">
        {checkboxes.slice(0, 3).map((checkbox) => (
          <CheckBox
            key={`${checkbox.value} - ${checkbox.label}`}
            checked={state.includes(checkbox.value)}
            label={checkbox.label}
            name={checkbox.label}
            onChange={handleCheckBoxes}
            value={checkbox.value}
          />
        ))}
      </div>

      <ComboBox
        checkboxes={checkboxes.slice(3)}
        checkedCheckBoxes={state}
        onChangeCheckBox={(e) => handleCheckBoxes(e)}
        placeholder="Other Province"
      />

      <div className="flex space-x-3 pt-2">
        <button
          type="button"
          className="inline-flex space-x-1 text-xs text-gray-500 underline"
          onClick={onResetToLastSaved}
        >
          <ClockIcon height={14} width={14} />
          <span>Last saved Province</span>
        </button>

        <button
          type="button"
          className="inline-flex items-center space-x-1 text-xs text-gray-500 underline"
          onClick={() =>
            setState((prevState) => {
              return {
                ...prevState,
                provinces: initialFilterState.provinces,
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

export default FilterByProvinces;
