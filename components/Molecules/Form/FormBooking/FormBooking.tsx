import React, { HTMLAttributes } from "react";

import { BanknotesIcon } from "@heroicons/react/20/solid";
import dayjs from "dayjs";

import Input from "components/Molecules/FormInput/Input/Input";

const FormBooking: React.FC<
  HTMLAttributes<HTMLDivElement> & {
    header?: string | React.ReactElement;
  }
> = ({
  className = "bg-neutral-50 shadow-xl sm:overflow-hidden sm:rounded-md",
  header,
  ...props
}) => {
  return (
    <div className={className} {...props}>
      <div className="space-y-6 px-4 py-5 sm:p-6">
        <form className="mt-8 space-y-6" action="#" method="POST">
          <div className="-space-y-px rounded-md shadow-sm">
            {header &&
              (typeof header === "string" ? (
                <h4 className="text-xl text-stone-700 pb-6">
                  {header}
                </h4>
              ) : (
                header
              ))}

            <Input
              container={{ className: "pb-6" }}
              label={{ text: "Nama Pemesan" }}
              name="booking-name"
              type="text"
            />
            <Input
              container={{ className: "pb-6" }}
              label={{ text: "Pilih tanggal booking" }}
              min={dayjs().format("YYYY-MM-DD")}
              name="booking-date"
              type="date"
            />

            <button
              type="submit"
              className="group relative mb-2 flex w-full justify-center rounded-sm border border-transparent bg-gradient-natours py-2 px-4 text-sm font-medium text-white hover:bg-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            >
              <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                <BanknotesIcon
                  className="h-5 w-5 text-white group-hover:text-white"
                  aria-hidden="true"
                  height={16}
                  width={16}
                />
              </span>
              Lanjut ke Pembayaran
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FormBooking;
