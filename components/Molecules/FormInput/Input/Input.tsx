import React, {
  HTMLAttributes,
  InputHTMLAttributes,
  LabelHTMLAttributes,
} from "react";

const Input: React.FC<
  InputHTMLAttributes<HTMLInputElement> & {
    container?: React.DetailedHTMLProps<
      HTMLAttributes<HTMLDivElement>,
      HTMLDivElement
    >;
    label?: React.DetailedHTMLProps<
      LabelHTMLAttributes<HTMLLabelElement>,
      HTMLLabelElement
    > & { text?: string };
  }
> = ({ ...props }) => {
  props.className =
    "relative block w-full appearance-none rounded-sm border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-green-500 focus:outline-none focus:ring-indigo-500 sm:text-sm";

  if (props.label && props.label.text) {
    props.label.className =
      "text-sm font-light text-stone-700 pb-1 inline-block";
    props.label.htmlFor = props.id;
  }

  return (
    <div {...props.container}>
      {props.label && props.label.text && (
        <label {...props.label}>{props.label.text}</label>
      )}
      <input {...props} />
    </div>
  );
};

export default Input;
