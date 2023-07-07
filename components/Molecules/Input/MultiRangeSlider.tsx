import {
  ChangeEventHandler,
  DetailedHTMLProps,
  FormEvent,
  InputHTMLAttributes,
  LabelHTMLAttributes,
} from "react";

import styled from "@emotion/styled";

interface IMultiRangeSliderProps
  extends InputHTMLAttributes<HTMLDivElement> {
  onInputTextEndChange: ChangeEventHandler<HTMLInputElement>;
  onInputTextStartChange: ChangeEventHandler<HTMLInputElement>;
  inputEnd: DetailedHTMLProps<
    InputHTMLAttributes<HTMLInputElement>,
    HTMLInputElement
  >;
  inputStart: DetailedHTMLProps<
    InputHTMLAttributes<HTMLInputElement>,
    HTMLInputElement
  >;
}

const MultiRangeSlider: React.FC<IMultiRangeSliderProps> = ({
  onInputTextEndChange,
  onInputTextStartChange,
  inputEnd,
  inputStart,
  ...props
}) => {
  const percentageOfInputEnd =
    (Number(inputEnd.value) / Number(inputStart.max ?? 100)) * 100;
  const percentageOfInputStart =
    (Number(inputStart.value) / Number(inputStart.max ?? 100)) * 100;

  return (
    <MultiRangeBase className="multi-range" {...props}>
      <div className="wrapper">
        <div className="flex pb-4 h-12">
          <div className="flex pr-2">
            <span className="inline-flex items-center px-3 text-sm text-gray-900 bg-gray-100 border border-r-0 border-gray-300 rounded-l-md dark:bg-gray-600 dark:text-gray-400 dark:border-gray-600">
              Rp
            </span>

            <input
              type="number"
              max={inputStart.max}
              min={inputStart.min}
              step={inputStart.step}
              id="visitors"
              className="focus:outline-0 rounded-none rounded-r-lg bg-gray-50 border text-gray-900 focus:ring-blue-500 focus:border-green-500 block flex-1 min-w-0 w-full text-sm border-gray-300 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
              onChange={onInputTextStartChange}
              placeholder="Terendah"
              value={inputStart.value?.toString()}
            />
          </div>

          <div className="flex">
            <span className="inline-flex items-center px-3 text-sm text-gray-900 bg-gray-100 border border-r-0 border-gray-300 rounded-l-md dark:bg-gray-600 dark:text-gray-400 dark:border-gray-600">
              Rp
            </span>

            <input
              type="number"
              max={inputEnd.max}
              min={inputEnd.min}
              step={inputEnd.step}
              id="visitors"
              className="focus:outline-0  rounded-none rounded-r-lg bg-gray-50 border text-gray-900 focus:ring-green-500 focus:border-green-500 block flex-1 min-w-0 w-full text-sm border-gray-300 p-2.5  dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
              onChange={onInputTextEndChange}
              placeholder="Tertinggi"
              value={inputEnd.value?.toString()}
            />
          </div>
        </div>

        <div className="container-input">
          <div
            className="slider-track"
            style={{
              background: `linear-gradient(to right, #dadae5 ${percentageOfInputStart}% , #55c57a ${percentageOfInputStart}% , #55c57a ${percentageOfInputEnd}%, #dadae5 ${percentageOfInputEnd}%)`,
            }}
          />

          <input
            onInput={(e: FormEvent<HTMLInputElement>) => {
              if (inputStart.onInput) {
                inputStart.onInput(e);
              }
            }}
            max={inputStart?.max ?? "100"}
            min={inputStart?.min ?? "0"}
            {...inputStart}
          />

          <input
            max={inputEnd?.max ?? "100"}
            min={inputEnd?.min ?? "0"}
            {...inputEnd}
          />
        </div>
      </div>
    </MultiRangeBase>
  );
};

const MultiRangeBase = styled.div`
  .wrapper {
    position: relative;
    width: 100%;
    background-color: #ffffff;
    /* padding: 50px 40px 20px 40px; */
    border-radius: 10px;
  }
  .container-input {
    position: relative;
    width: 100%;
  }
  input[type="range"] {
    -webkit-appearance: none;
    -moz-appearance: none;
    appearance: none;
    width: 100%;
    outline: none;
    position: absolute;
    margin: auto;
    top: 0;
    bottom: 0;
    background-color: transparent;
    pointer-events: none;
  }
  .slider-track {
    width: 100%;
    height: 2px;
    position: absolute;
    margin: auto;
    top: 0;
    bottom: 0;
    border-radius: 5px;
  }
  input[type="range"]::-webkit-slider-runnable-track {
    -webkit-appearance: none;
    height: 5px;
  }
  input[type="range"]::-moz-range-track {
    -moz-appearance: none;
    height: 5px;
  }
  input[type="range"]::-ms-track {
    appearance: none;
    height: 5px;
  }
  input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    height: 16px;
    width: 16px;
    background-color: #55c57a;
    cursor: pointer;
    margin-top: -5px;
    pointer-events: auto;
    border-radius: 50%;
  }
  input[type="range"]::-moz-range-thumb {
    -webkit-appearance: none;
    appearance: none;
    height: 16px;
    width: 16px;
    cursor: pointer;
    border-radius: 50%;
    background-color: #55c57a;
    pointer-events: auto;
  }
  input[type="range"]::-ms-thumb {
    appearance: none;
    height: 16px;
    width: 16px;
    cursor: pointer;
    border-radius: 50%;
    background-color: #55c57a;
    pointer-events: auto;
  }
  input[type="range"]:active::-webkit-slider-thumb {
    background-color: #ffffff;
    border: 1px solid #55c57a;
  }
  .values {
    background-color: #55c57a;
    width: 32%;
    position: relative;
    margin: auto;
    padding: 10px 0;
    border-radius: 5px;
    text-align: center;
    font-weight: 500;
    font-size: 25px;
    color: #ffffff;
  }
  .values:before {
    content: "";
    position: absolute;
    height: 0;
    width: 0;
    border-top: 15px solid #55c57a;
    border-left: 15px solid transparent;
    border-right: 15px solid transparent;
    margin: auto;
    bottom: -14px;
    left: 0;
    right: 0;
  }
`;

export default MultiRangeSlider;
