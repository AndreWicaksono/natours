import React, { HTMLAttributes } from "react";
import { LockClosedIcon } from "@heroicons/react/20/solid";

import Input from "components/Molecules/FormInput/Input/Input";

const FormLogin: React.FC<
  HTMLAttributes<HTMLDivElement> & { header?: string | React.ReactElement }
> = ({
  className = "bg-neutral-50 shadow-xl sm:overflow-hidden sm:rounded-md",
  header,
  ...props
}) => {
  return (
    <div className={className} {...props}>
      <div className="space-y-6 px-4 py-5 sm:p-6">
        <form className="mt-8 space-y-6" action="#" method="POST">
          <input type="hidden" name="remember" defaultValue="true" />
          <div className="-space-y-px rounded-md shadow-sm">
            {header &&
              (typeof header === "string" ? (
                <h4 className="text-xl text-stone-700 pb-6">{header}</h4>
              ) : (
                header
              ))}

            <Input
              id="login-email"
              autoComplete="email"
              container={{ className: " pb-6" }}
              label={{ text: "E-mail" }}
              name="email"
              required
              type="email"
            />

            <Input
              id="password"
              autoComplete="current-password"
              label={{ text: "Password" }}
              name="password"
              required
              type="password"
            />
          </div>

          <div className="flex items-center justify-end">
            <div className="text-sm">
              <a
                href="#"
                className="font-light text-gray-700 hover:underline hover:underline-offset-2"
              >
                Lupa password?
              </a>
            </div>
          </div>

          <div className="text-center">
            <button
              type="submit"
              className="group relative mb-2 flex w-full justify-center rounded-sm border border-transparent bg-gradient-natours py-2 px-4 text-sm font-medium text-white hover:bg-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            >
              <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                <LockClosedIcon
                  className="h-5 w-5 text-white group-hover:text-white"
                  aria-hidden="true"
                  height={16}
                  width={16}
                />
              </span>
              Masuk
            </button>
            <a
              href="#"
              className="font-light text-sm text-gray-700 hover:underline hover:underline-offset-2"
            >
              Belum punya akun? Daftar di sini
            </a>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FormLogin;
