import {
  ChangeEvent,
  HTMLAttributes,
  RefObject,
  useRef,
  useState,
} from "react";
import { Transition } from "@headlessui/react";

import CheckBox from "components/Molecules/Input/CheckBox";
import { useOnClickOutside } from "utils/Hooks/useOnClickOutside";

const ComboBox: React.FC<
  {
    checkboxes: Array<{ label: string; value: string }>;
    checkedCheckBoxes: Array<string>;
    onChangeCheckBox?: (event: ChangeEvent<HTMLInputElement>) => void;
  } & HTMLAttributes<HTMLDivElement>
> = ({
  checkboxes,
  checkedCheckBoxes,
  onChangeCheckBox,
  placeholder,
  ...props
}) => {
  const [comboBox, setComboBox] = useState<{
    isOpen: boolean;
    searchKeyword: string;
  }>({ isOpen: false, searchKeyword: "" });

  const refComboBox: RefObject<HTMLInputElement> = useRef(null);

  useOnClickOutside(refComboBox, () =>
    setComboBox((prevState) => {
      return {
        ...prevState,
        isOpen: false,
      };
    })
  );

  return (
    <div ref={refComboBox} {...props}>
      <div>
        <label htmlFor="input-group-search" className="sr-only">
          Search
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <svg
              className="w-5 h-5 text-gray-500 dark:text-gray-400"
              aria-hidden="true"
              fill="currentColor"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                clipRule="evenodd"
              ></path>
            </svg>
          </div>

          <input
            type="text"
            id="input-group-search"
            className="block w-full py-[9px] pl-10 text-sm text-gray-900 shadow-[rgb(209_213_219)_0px_0px_0px_1px] rounded-lg bg-gray-50 focus-visible:outline-0 focus-visible:shadow-[#55c57a_0px_0px_0px_1px] focus-visible:outline-green-500 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
            placeholder={placeholder}
            onChange={(e) => {
              setComboBox((prevState) => {
                return {
                  ...prevState,
                  isOpen: true,
                  searchKeyword: e.target.value,
                };
              });
            }}
            onClick={(e) =>
              setComboBox((prevState) => {
                return { ...prevState, isOpen: !prevState.isOpen };
              })
            }
          />
        </div>
      </div>

      <Transition
        className="relative z-[1]"
        enter="transition duration-200 ease-out"
        enterFrom="transform scale-95 opacity-0"
        enterTo="transform scale-100 opacity-100"
        leave="transition duration-75 ease-out"
        leaveFrom="transform scale-100 opacity-100"
        leaveTo="transform scale-95 opacity-0"
        show={comboBox.isOpen}
      >
        {comboBox.isOpen && (
          <div
            id="dropdownSearch"
            className="absolute border-[.8px] top-2 inset-x-0 block bg-white rounded-lg shadow-md dark:bg-gray-700 pt-3"
          >
            <ul
              className="h-48 px-3 pb-3 overflow-y-auto text-sm text-gray-700 dark:text-gray-200 space-y-2"
              aria-labelledby="dropdownSearchButton"
            >
              {checkboxes
                .filter((checkbox) =>
                  checkbox.label
                    .toLowerCase()
                    .includes(comboBox.searchKeyword.toLowerCase())
                )
                .map((checkbox) => (
                  <li key={`${checkbox.value}-${checkbox.label}`}>
                    <div className="flex items-center pl-2 rounded hover:bg-gray-100 dark:hover:bg-gray-600">
                      <CheckBox
                        checked={checkedCheckBoxes.includes(
                          checkbox.value
                        )}
                        label={checkbox.label}
                        name={checkbox.label}
                        onChange={onChangeCheckBox}
                        value={checkbox.value}
                      />
                    </div>
                  </li>
                ))}
            </ul>

            <div className="flex items-center justify-end p-3 text-sm font-medium text-red-600 border-t border-gray-200 rounded-b-lg bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-red-500">
              <button
                type="button"
                className="text-sm text-gray-500 underline"
                onClick={() =>
                  setComboBox((prevState) => {
                    return {
                      ...prevState,
                      isOpen: false,
                    };
                  })
                }
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Transition>
    </div>
  );
};

export default ComboBox;
