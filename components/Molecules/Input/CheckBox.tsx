import styled from "@emotion/styled";
import { InputHTMLAttributes } from "react";

interface ICheckBoxProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

const CheckBox: React.FC<ICheckBoxProps> = ({ label, name, ...props }) => {
  return (
    <CheckBoxBase className="flex items-center">
      <div className="canvas">
        <input id="default-checkbox" type="checkbox" name={name} {...props} />
        <span className="checkmark"></span>
      </div>

      {label && (
        <label htmlFor={name} className="ml-2 text-sm text-gray-900">
          {label}
        </label>
      )}
    </CheckBoxBase>
  );
};

const CheckBoxBase = styled.div`
  /* The container */
  .canvas {
    height: 16px;
    width: 16px;

    display: block;
    position: relative;

    cursor: pointer;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
  }

  /* Hide the browser's default checkbox */
  .canvas input {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    z-index: 1;

    cursor: pointer;
    opacity: 0;
  }

  /* Create a custom checkbox */
  .checkmark {
    position: absolute;
    top: 0;
    left: 0;

    height: 16px;
    width: 16px;

    background-color: #fff;
    border-radius: 2px;
    box-shadow: #94a3b8 0px 0px 0px 1px;
  }

  /* On mouse-over, add a grey background color */
  .canvas:hover input ~ .checkmark {
    background-color: rgb(85 197 122 / 30%);
    box-shadow: #55c57a 0px 0px 0px 1px;
  }

  /* When the checkbox is checked, add a blue background */
  .canvas input:checked ~ .checkmark {
    background-color: #55c57a;
    box-shadow: #55c57a 0px 0px 0px 1px;
  }

  /* Create the checkmark/indicator (hidden when not checked) */
  .checkmark:after {
    content: "";
    position: absolute;
    display: none;
  }

  /* Show the checkmark when checked */
  .canvas input:checked ~ .checkmark:after {
    display: block;
  }

  /* Style the checkmark/indicator */
  .canvas .checkmark:after {
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;

    height: 10px;
    width: 5px;

    border: solid white;
    border-width: 0 2px 2px 0;
    margin: auto;
    -webkit-transform: rotate(45deg);
    -ms-transform: rotate(45deg);
    transform: rotate(45deg);
  }
`;

export default CheckBox;
