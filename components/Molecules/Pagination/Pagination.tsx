import {
  ArrowLongLeftIcon,
  ArrowLongRightIcon,
} from "@heroicons/react/20/solid";
import { HTMLAttributes, MouseEventHandler } from "react";

const paginate = (currentPage: number, totalPage: number) => {
  let delta = 1,
    left = currentPage - delta,
    right = currentPage + delta + 1,
    result = [];

  result = Array.from({ length: totalPage }, (v, k) => k + 1).filter(
    (i) => i && i >= left && i < right
  );

  return result;
};

const Pagination: React.FC<
  {
    label?: {
      resultDisplayedEnd: number;
      resultDisplayedStart: number;
      resultTotal: number;
    };
    onClickPagination: MouseEventHandler<HTMLButtonElement>;
    pageActive: number;
    pageTotal: number;
  } & HTMLAttributes<HTMLElement>
> = ({
  label,
  onClickPagination,
  pageActive = 1,
  pageTotal = 10,
  ...props
}) => {
  const pageList: number[] = paginate(pageActive, pageTotal);

  const renderPaginationItems = (): React.ReactNode[] => {
    return pageList.map((pageNumber) => (
      <li key={`page-${pageNumber}`}>
        <button
          className={`font-medium text-base flex items-center justify-center px-3 h-8 leading-tight text-gray-500 bg-white hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white transition-all duration-150 ease-in-out${
            pageNumber === pageActive
              ? " border-t-2 border-t-[#55c57a] text-[#55c57a]"
              : "text-[rgb(107 114 128)] "
          }`}
          onClick={onClickPagination}
          value={pageNumber}
        >
          {pageNumber}
        </button>
      </li>
    ));
  };

  return (
    <div className="flex flex-col space-y-2">
      <nav className="flex justify-between border border-t border-x-0 border-b-0 border-t-[rgb(229 231 235)]">
        <button
          className="text-[rgb(107 114 128)] font-medium text-base flex items-center justify-center px-3 h-8 ml-0 leading-tight text-gray-500 bg-white hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white space-x-3"
          onClick={onClickPagination}
          value={pageActive - 1}
        >
          <span>
            <ArrowLongLeftIcon
              color="rgb(156 163 175)"
              height={16}
              width={24}
            />
          </span>
          <span>Previous</span>
        </button>

        <ul className="inline-flex -space-x-px text-sm">
          {renderPaginationItems()}
        </ul>

        <button
          className="text-[rgb(107 114 128)] font-medium text-base flex items-center justify-center px-3 h-8 leading-tight text-gray-500 bg-white hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white space-x-3"
          onClick={onClickPagination}
          value={pageActive + 1}
        >
          <span>Next</span>
          <span>
            <ArrowLongRightIcon
              color="rgb(156 163 175)"
              height={16}
              width={24}
            />
          </span>
        </button>
      </nav>

      {label && (
        <div className="flex justify-center text-sm">
          Showing {label.resultDisplayedStart} to{" "}
          {label.resultDisplayedEnd} of {label.resultTotal} results
        </div>
      )}
    </div>
  );
};

export default Pagination;
