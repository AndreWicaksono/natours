import React, { HTMLAttributes } from "react";

const Breadcrumb: React.FC<
  {
    data: {
      breadcrumbs: Array<{ id: number | string; href: string; name: string }>;
      detail: {
        href: string;
        name: string;
      };
    };
  } & HTMLAttributes<HTMLElement>
> = ({ data }) => {
  return (
    <nav aria-label="Breadcrumb">
      <ol
        role="list"
        className="mx-auto flex items-center space-x-2 lg:max-w-7xl"
      >
        {data.breadcrumbs.map((item) => (
          <li key={item.id}>
            <div className="flex items-center">
              <a
                href={item.href}
                className="mr-2 text-sm font-medium text-stone-500 hover:underline hover:underline-offset-2"
              >
                {item.name}
              </a>
              <svg
                width={16}
                height={20}
                viewBox="0 0 16 20"
                fill="currentColor"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
                className="h-5 w-4 text-stone-300"
              >
                <path d="M5.697 4.34L8.98 16.532h1.327L7.025 4.341H5.697z" />
              </svg>
            </div>
          </li>
        ))}
        <li className="text-sm">
          <span aria-current="page" className="font-medium text-gray-500">
            {data.detail.name}
          </span>
        </li>
      </ol>
    </nav>
  );
};

export default Breadcrumb;
