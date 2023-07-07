import {
  ButtonHTMLAttributes,
  Fragment,
  HTMLAttributes,
  MouseEvent,
  MouseEventHandler,
} from "react";

import { AdjustmentsHorizontalIcon } from "@heroicons/react/24/outline";

import Modal from "components/Molecules/Modal/Modal";
import Pagination from "components/Molecules/Pagination/Pagination";

import useWindowSize from "utils/Hooks/useWindowSize";
import FilterListingTour, {
  TypeObjectFilter_TourListing,
} from "components/Organisms/Filter/FilterListingTour/FilterListingTour";

interface IListingProps extends HTMLAttributes<HTMLElement> {
  appliedFilter: TypeObjectFilter_TourListing;
  heading?: string;
  onFilterApplied: (
    e: MouseEvent<HTMLButtonElement>,
    stateToBeApplied: TypeObjectFilter_TourListing
  ) => void;
  pagination: {
    onClick: MouseEventHandler<HTMLButtonElement>;
    pageActive: number;
    pageTotal: number;
    resultDisplayedEnd: number;
    resultDisplayedStart: number;
    resultTotal: number;
  };
}

const ButtonModal: React.FC<
  ButtonHTMLAttributes<HTMLButtonElement>
> = (props) => <button {...props}>{props.children}</button>;

const Listing: React.FC<IListingProps> = ({
  appliedFilter,
  children,
  heading,
  onFilterApplied,
  pagination,
}) => {
  const { width } = useWindowSize();

  if (!width) return null;

  return (
    <Fragment>
      <div className="flex justify-between pb-4">
        {heading && <h5>{heading}</h5>}

        {width < 1208 && (
          <Modal
            buttonModal={(propsButtonModal) => (
              <ButtonModal
                className="fixed sm:relative translate-x-[50%] sm:translate-x-0 translate-y-[-50%] sm:translate-y-0 right-2/4 sm:right-auto bottom-6 sm:bottom-auto z-10 bg-white xl:hidden flex items-center space-x-2 rounded-md border border-gray-200 shadow-md md:bg-opacity-20 px-4 py-2 text-sm font-medium hover:bg-opacity-30 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75"
                type="button"
                {...propsButtonModal}
              >
                <span>
                  <AdjustmentsHorizontalIcon height={20} width={20} />
                </span>
                <span>Filters</span>
              </ButtonModal>
            )}
            classNamePanel="h-screen sm:h-auto relative w-full max-w-md transform overflow-hidden sm:rounded-lg bg-white text-left align-middle transition-all"
            closeIconClassName="absolute inline-block right-2 top-2 m-auto"
            dependencyListCloseModal={[appliedFilter]}
          >
            <FilterListingTour
              appliedFilter={appliedFilter}
              onSave={onFilterApplied}
            />
          </Modal>
        )}
      </div>

      <div className="grid lg:grid-cols-1 xl:grid-cols-[minmax(0,_320px)_1fr] gap-4 items-start pb-8">
        {width >= 1208 && (
          <FilterListingTour
            appliedFilter={appliedFilter}
            onSave={onFilterApplied}
          />
        )}

        <div className="space-y-8">
          <div className="grid sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {children}
          </div>

          {width >= 1024 && (
            <Pagination
              label={{
                resultDisplayedEnd: pagination.resultDisplayedEnd,
                resultDisplayedStart: pagination.resultDisplayedStart,
                resultTotal: pagination.resultTotal,
              }}
              onClickPagination={pagination.onClick}
              pageActive={pagination.pageActive}
              pageTotal={pagination.pageTotal}
            />
          )}
        </div>
      </div>

      {width < 1024 && (
        <button className="w-full mb-6 xl:hidden space-x-2 rounded-md border border-gray-200 shadow-xs px-4 py-2 text-sm font-medium hover:bg-opacity-30 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75">
          Load More
        </button>
      )}
    </Fragment>
  );
};

export default Listing;
