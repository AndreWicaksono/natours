import { ChangeEvent, HTMLAttributes, useState } from "react";

import {
  ArrowsUpDownIcon,
  BanknotesIcon,
  MapPinIcon,
} from "@heroicons/react/20/solid";
import {
  AdjustmentsHorizontalIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";

import CheckBox from "components/Molecules/Input/CheckBox";
import ComboBox from "components/Molecules/ComboBox/ComboBox";
import MultiRangeSlider from "components/Molecules/Input/MultiRangeSlider";

interface IFilterProps extends HTMLAttributes<HTMLDivElement> {}

type ObjectFilter = {
  price: {
    end: number;
    start: number;
  };
  provinces: Array<string>;
  sort: "price:asc" | "price:desc" | "none";
};

type StateFilter = {
  draft: ObjectFilter;
  saved: ObjectFilter;
};

const initialFilterState: ObjectFilter = {
  price: {
    end: 10000000,
    start: 0,
  },
  provinces: [],
  sort: "none",
};

const Filter: React.FC<IFilterProps> = ({
  className = "overflow-hidden rounded-lg border border-gray-200 shadow-lg text-gray-700",
  ...props
}) => {
  const [filter, setFilter] = useState<StateFilter>({
    draft: initialFilterState,
    saved: initialFilterState,
  });

  const checkboxes: Array<{ label: string; value: string }> = [
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
  ];

  const handleCheckBoxes: (
    e: ChangeEvent<HTMLInputElement>
  ) => void = (e) => {
    setFilter((prevState) => {
      return {
        ...prevState,
        draft: {
          ...prevState.draft,
          provinces: e.target.checked
            ? [...prevState.draft.provinces, e.target.value]
            : [...prevState.draft.provinces].filter(
                (item) => item !== e.target.value
              ),
        },
      };
    });
  };

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
        <legend className="flex items-center block w-full bg-gray-50 px-4 py-3 text-sm font-medium space-x-1">
          <ArrowsUpDownIcon height={16} width={16} />
          <span>Sort</span>
        </legend>

        <fieldset>
          <div className="space-y-2 px-4 py-6">
            <ul className="grid max-w-full w-full grid-cols-3 gap-x-2">
              <li className="">
                <input
                  className="peer sr-only"
                  type="radio"
                  value="price:asc"
                  name="price:asc"
                  id="price:asc"
                  checked={filter.draft.sort === "price:asc"}
                  onClick={(e) => {
                    setFilter((prevState) => {
                      return {
                        ...prevState,
                        draft: {
                          ...prevState.draft,
                          sort:
                            prevState.draft.sort === "price:asc"
                              ? "none"
                              : "price:asc",
                        },
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
                  checked={filter.draft.sort === "price:desc"}
                  onClick={(e) => {
                    setFilter((prevState) => {
                      return {
                        ...prevState,
                        draft: {
                          ...prevState.draft,
                          sort:
                            prevState.draft.sort === "price:desc"
                              ? "none"
                              : "price:desc",
                        },
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
                onClick={(e) =>
                  setFilter((prevState) => {
                    return {
                      ...prevState,
                      draft: {
                        ...prevState.draft,
                        sort: prevState.saved.sort,
                      },
                    };
                  })
                }
              >
                <ClockIcon height={14} width={14} />
                <span>Last saved Sort</span>
              </button>

              <button
                type="button"
                className="inline-flex items-center space-x-1 text-xs text-gray-500 underline"
                onClick={() =>
                  setFilter((prevState) => {
                    return {
                      ...prevState,
                      draft: {
                        ...prevState.draft,
                        sort: initialFilterState.sort,
                      },
                    };
                  })
                }
              >
                <span>Clear</span>
              </button>
            </div>
          </div>
        </fieldset>

        <fieldset className="w-full">
          <legend className="flex items-center block w-full bg-gray-50 px-4 py-3 text-sm font-medium space-x-1">
            <MapPinIcon height={16} width={16} />
            <span>Province</span>
          </legend>

          <div className="space-y-2 px-4 py-6">
            <div className="pb-2 space-y-2">
              {checkboxes.slice(0, 3).map((checkbox) => (
                <CheckBox
                  key={`${checkbox.value} - ${checkbox.label}`}
                  checked={filter.draft.provinces.includes(
                    checkbox.value
                  )}
                  label={checkbox.label}
                  name={checkbox.label}
                  onChange={handleCheckBoxes}
                  value={checkbox.value}
                />
              ))}
            </div>

            <ComboBox
              checkboxes={[
                { label: "Daerah Istimewa Yogyakarta", value: "4" },
                { label: "Jawa Timur", value: "5" },
                { label: "Banten", value: "6" },
                { label: "Aceh", value: "7" },
                { label: "Sumatera Utara", value: "8" },
                { label: "Sumatera Barat", value: "9" },
              ]}
              checkedCheckBoxes={filter.draft.provinces}
              onChangeCheckBox={(e) => handleCheckBoxes(e)}
              placeholder="Other Province"
            />

            <div className="flex space-x-3 pt-2">
              <button
                type="button"
                className="inline-flex space-x-1 text-xs text-gray-500 underline"
                onClick={(e) =>
                  setFilter((prevState) => {
                    return {
                      ...prevState,
                      draft: {
                        ...prevState.draft,
                        provinces: prevState.saved.provinces,
                      },
                    };
                  })
                }
              >
                <ClockIcon height={14} width={14} />
                <span>Last saved Province</span>
              </button>

              <button
                type="button"
                className="inline-flex items-center space-x-1 text-xs text-gray-500 underline"
                onClick={() =>
                  setFilter((prevState) => {
                    return {
                      ...prevState,
                      draft: {
                        ...prevState.draft,
                        provinces: initialFilterState.provinces,
                      },
                    };
                  })
                }
              >
                <span>Clear</span>
              </button>
            </div>
          </div>
        </fieldset>

        <fieldset className="w-full">
          <legend className="flex items-center block w-full bg-gray-50 px-4 py-3 text-sm font-medium mb-6 space-x-1">
            <BanknotesIcon height={16} width={16} />
            <span>Price</span>
          </legend>

          <MultiRangeSlider
            className="px-4"
            inputEnd={{
              type: "range",
              step: 25000,
              min: 0,
              max: 10000000,
              value: filter.draft.price.end,
              id: "slider-2",
              onInput: (e) => {
                const value: number = Number(e?.currentTarget?.value);

                if (value >= filter.draft.price.start) {
                  setFilter((prevState) => {
                    return {
                      ...prevState,
                      draft: {
                        ...prevState.draft,
                        price: {
                          ...prevState.draft.price,
                          end: value,
                        },
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
              value: filter.draft.price.start,
              id: "slider-1",
              onInput: (e) => {
                const value: number = Number(e?.currentTarget?.value);

                if (value <= filter.draft.price.end) {
                  setFilter((prevState) => {
                    return {
                      ...prevState,
                      draft: {
                        ...prevState.draft,
                        price: {
                          ...prevState.draft.price,
                          start: value,
                        },
                      },
                    };
                  });
                }
              },
            }}
            onInputTextEndChange={(e) => {
              let value: number = Number(e?.target?.value);

              const price = {
                end: filter.draft.price.end,
                start: filter.draft.price.start,
              };

              if (value < filter.draft.price.start) {
                price.end = filter.draft.price.start;
              } else if (value > 10000000) {
                price.end = 10000000;
              } else {
                price.end = value;
              }

              setFilter((prevState) => {
                return {
                  ...prevState,
                  draft: {
                    ...prevState.draft,
                    price: {
                      end: price.end,
                      start: price.start,
                    },
                  },
                };
              });
            }}
            onInputTextStartChange={(e) => {
              let value: number = Number(e?.target?.value);

              const price = {
                end: filter.draft.price.end,
                start: filter.draft.price.start,
              };

              if (value > filter.draft.price.end) {
                price.start = filter.draft.price.end;
              } else if (value > 10000000) {
                price.start = 10000000;
              } else {
                price.start = value;
              }

              setFilter((prevState) => {
                return {
                  ...prevState,
                  draft: {
                    ...prevState.draft,
                    price: {
                      end: price.end,

                      start: price.start,
                    },
                  },
                };
              });
            }}
          />

          <div className="space-y-2 px-4 py-6">
            <div className="flex space-x-3 pt-2">
              <button
                type="button"
                className="inline-flex space-x-1 text-xs text-gray-500 underline"
                onClick={() =>
                  setFilter((prevState) => {
                    return {
                      ...prevState,
                      draft: {
                        ...prevState.draft,
                        price: {
                          ...prevState.saved.price,
                        },
                      },
                    };
                  })
                }
              >
                <ClockIcon height={14} width={14} />
                <span>Last saved Price</span>
              </button>

              <button
                type="button"
                className="inline-flex items-center space-x-1 text-xs text-gray-500 underline"
                onClick={() =>
                  setFilter((prevState) => {
                    return {
                      ...prevState,
                      draft: {
                        ...prevState.draft,
                        price: initialFilterState.price,
                      },
                    };
                  })
                }
              >
                <span>Clear</span>
              </button>
            </div>
          </div>
        </fieldset>
      </form>

      <div className="flex justify-between border-t border-gray-200 px-4 py-3">
        <div className="flex items-end justify-between space-x-2">
          <button
            name="reset"
            type="button"
            className="inline-flex items-center rounded text-xs font-medium text-gray-600 underline space-x-1"
            onClick={() =>
              setFilter((prevState) => {
                return {
                  ...prevState,
                  draft: prevState.saved,
                };
              })
            }
          >
            <ClockIcon height={14} width={14} />
            <span>Last saved</span>
          </button>

          <button
            name="reset"
            type="button"
            className="rounded text-xs font-medium text-gray-600 underline"
            onClick={() =>
              setFilter((prevState) => {
                return {
                  ...prevState,
                  draft: initialFilterState,
                };
              })
            }
          >
            Clear all
          </button>
        </div>

        <button
          disabled={
            filter.draft.price.end === filter.saved.price.end &&
            filter.draft.price.start === filter.saved.price.start &&
            filter.draft.sort === filter.saved.sort &&
            filter.draft.provinces.length ==
              filter.saved.provinces.length &&
            filter.draft.provinces.every((element) => {
              return filter.saved.provinces.includes(element);
            })
          }
          name="commit"
          type="button"
          className="disabled:bg-slate-300 disabled:bg-none rounded bg-blue-600 px-4 py-3 text-sm font-medium text-white enabled:active:scale-95 bg-gradient-natours"
          onClick={() =>
            setFilter((prevState) => {
              return {
                ...prevState,
                saved: prevState.draft,
              };
            })
          }
        >
          Apply Filters
        </button>
      </div>
    </div>
  );
};

export default Filter;
