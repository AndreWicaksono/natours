import {
  ButtonHTMLAttributes,
  DetailedHTMLProps,
  HTMLAttributes,
  ReactElement,
} from "react";

import { AdjustmentsHorizontalIcon } from "@heroicons/react/24/outline";

interface IFilterBoxProps extends HTMLAttributes<HTMLDivElement> {
  button: {
    apply: DetailedHTMLProps<
      ButtonHTMLAttributes<HTMLButtonElement>,
      HTMLButtonElement
    >;
    resetAllToDefault: DetailedHTMLProps<
      ButtonHTMLAttributes<HTMLButtonElement>,
      HTMLButtonElement
    >;
    resetAllToLastSaved: DetailedHTMLProps<
      ButtonHTMLAttributes<HTMLButtonElement>,
      HTMLButtonElement
    >;
  };
  filters: Array<{
    component: ReactElement;
    heading: string;
    icon: ReactElement;
  }>;
}

const FilterBox: React.FC<IFilterBoxProps> = ({
  button,
  className = "overflow-hidden rounded-lg border border-gray-200 shadow-lg text-gray-700",
  filters,
  ...props
}) => {
  return (
    <div className={className} {...props}>
      <summary className="flex select-none items-center bg-gray-100 px-4 py-3 space-x-2">
        <AdjustmentsHorizontalIcon height={20} width={20} />
        <span className="text-normal font-bold">Filters </span>
      </summary>

      <form
        action=""
        className="flex flex-col border-t border-gray-200 lg:border-t-0"
      >
        {filters &&
          (filters ?? []).map((filterItem) => (
            <fieldset key={filterItem.heading}>
              <legend className="flex items-center block w-full bg-gray-50 px-4 py-3 text-sm font-medium space-x-1">
                {filterItem.icon}
                <span>{filterItem.heading}</span>
              </legend>

              <div className="space-y-2 px-4 py-6">
                {filterItem.component}
              </div>
            </fieldset>
          ))}
      </form>

      <div className="flex justify-between border-t border-gray-200 px-4 py-3">
        <div className="flex items-end justify-between space-x-2">
          <button {...button.resetAllToLastSaved}>
            {button.resetAllToLastSaved.children}
          </button>

          <button {...button.resetAllToDefault}>
            {button.resetAllToDefault.children}
          </button>
        </div>

        <button {...button?.apply}>{button?.apply.children}</button>
      </div>
    </div>
  );
};

export default FilterBox;
