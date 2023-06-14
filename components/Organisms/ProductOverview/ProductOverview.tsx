import { Fragment, RefObject, useEffect, useRef, useState } from "react";
import {
  BanknotesIcon,
} from "@heroicons/react/20/solid";
import { RadioGroup } from "@headlessui/react";
import Breadcrumb from "components/Molecules/Breadcrumb/Breadcrumb";
import TabsGeneral from "../Tabs/General";
import LabelCheckpoint, {
  LabelCheckpoint_CheckpointBullet_PathObject,
} from "components/Molecules/Label/LabelCheckpoint";
import Rating from "components/Molecules/Rating/Rating";
import FormLogin from "components/Molecules/Form/FormLogin/FormLogin";
import FormBooking from "components/Molecules/Form/FormBooking/FormBooking";

const product = {
  name: "Pangandaran Private Tour",
  price: "Rp1.920.000",
  href: "#",
  breadcrumbs: [{ id: 1, name: "Tour", href: "/tour/" }],
  images: [
    {
      src: "https://tailwindui.com/img/ecommerce-images/product-page-02-secondary-product-shot.jpg",
      alt: "Two each of gray, white, and black shirts laying flat.",
    },
    {
      src: "https://tailwindui.com/img/ecommerce-images/product-page-02-tertiary-product-shot-01.jpg",
      alt: "Model wearing plain black basic tee.",
    },
    {
      src: "https://tailwindui.com/img/ecommerce-images/product-page-02-tertiary-product-shot-02.jpg",
      alt: "Model wearing plain gray basic tee.",
    },
    {
      src: "https://tailwindui.com/img/ecommerce-images/product-page-02-featured-product-shot.jpg",
      alt: "Model wearing plain white basic tee.",
    },
  ],
  colors: [
    { name: "White", class: "bg-white", selectedClass: "ring-gray-400" },
    { name: "Gray", class: "bg-gray-200", selectedClass: "ring-gray-400" },
    { name: "Black", class: "bg-gray-900", selectedClass: "ring-gray-900" },
  ],
  sizes: [
    { name: "XXS", inStock: false },
    { name: "XS", inStock: true },
    { name: "S", inStock: true },
    { name: "M", inStock: true },
    { name: "L", inStock: true },
    { name: "XL", inStock: true },
    { name: "2XL", inStock: true },
    { name: "3XL", inStock: true },
  ],
  description:
    'The Basic Tee 6-Pack allows you to fully express your vibrant personality with three grayscale options. Feeling adventurous? Put on a heather gray tee. Want to be a trendsetter? Try our exclusive colorway: "Black". Need to add an extra pop of color to your outfit? Our white tee has you covered.',
  highlights: [
    "Hand cut and sewn locally",
    "Dyed with our proprietary colors",
    "Pre-washed & pre-shrunk",
    "Ultra-soft 100% cotton",
  ],
  details:
    'The 6-Pack includes two black, two white, and two heather gray Basic Tees. Sign up for our subscription service and be the first to get new, exciting colors, like our upcoming "Charcoal Gray" limited release.',
  schedules: [
    {
      data: [
        { id: "1", activity: "Berangkat", time: "09:00" },
        { id: "2", activity: "Makan siang", time: "12:00" },
        { id: "3", activity: "Lanjut perjalanan", time: "13:00" },
        { id: "4", activity: "Tiba di villa", time: "15:00" },
      ],
      name: "Day: 1",
    },
  ],
};
const reviews = { href: "#", average: 4, totalCount: 117 };

function classNames(...classes: any[]) {
  return classes.filter(Boolean).join(" ");
}

export default function Example() {
  const [selectedColor, setSelectedColor] = useState(product.colors[0]);
  const [selectedSize, setSelectedSize] = useState(product.sizes[2]);

  const isLogin: boolean = false;
  const refRating: RefObject<SVGSVGElement> = useRef(null);

  const generateLabelCheckpointProps = (
    currentIndex: number,
    firstIndex: number,
    lastIndex: number
  ): {
    className?: string;
    path?: LabelCheckpoint_CheckpointBullet_PathObject;
  } => {
    switch (true) {
      case currentIndex === firstIndex:
        return {
          className: "pb-4 text-gray-900",
          path: { top: { size: 0 } },
        };

      case currentIndex > firstIndex && currentIndex < lastIndex:
        return {
          className: "pb-4 text-gray-900",
        };

      case currentIndex === lastIndex:
        return {
          className: "text-gray-900",
          path: { bottom: { size: 0 } },
        };

      default:
        return {};
    }
  };

  useEffect(() => {
    if (refRating && refRating.current) {
      refRating.current.insertAdjacentHTML(
        "afterbegin",
        `
      <defs>
        <linearGradient id="lastRatingIconFill" x1="30%" y1="0%" x2="70%" y2="0%">
          <stop offset="30%" stop-color="#55c57a" />
          <stop offset="70%" stop-color="#e5e7eb" stop-opacity="1"/>
        </linearGradient>            
      </defs>
      `
      );
    }
  }, []);

  return (
    <div className="bg-white">
      <div className="pt-6">
        <Breadcrumb
          data={{
            breadcrumbs: product.breadcrumbs,
            detail: { href: product.href, name: product.name },
          }}
        />

        {/* Product info */}
        <div className="mx-auto pt-10 pb-16 lg:grid lg:max-w-7xl lg:grid-cols-3 lg:grid-rows-[auto,auto,1fr] lg:gap-x-8 lg:pt-16 lg:pb-24">
          <div className="lg:col-span-2 lg:border-r lg:border-gray-200 lg:pr-8">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
              {product.name}
            </h1>
          </div>

          {/* Options */}
          <div className="relative mt-4 lg:row-span-3 lg:mt-0">
            <div style={{ position: "sticky", top: 104 }}>
              {/* <h2 className="sr-only">Product information</h2>
              <p className="text-3xl tracking-tight text-gray-900">
                {product.price}
              </p> */}

              {/* Reviews */}
              {/* StarIcon should be changed into this method https://github.com/tailwindlabs/heroicons/discussions/424 */}
              {/* <div> */}
              {/* <h3 className="sr-only">Reviews</h3>
                <div className="flex items-center">
                  <Rating className="pb-6" totalReview={2} value={4.7} />
                </div> */}
              <div className="hidden lg:block bg-white rounded-xl p-4 lg:p-6 shadow-xl">
                <p className="pb-6 text-3xl tracking-tight text-gray-900">
                  {product.price}
                </p>

                <div className="flex items-center">
                  <Rating className="pb-6" totalReview={2} value={4.7} />
                </div>

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

                  <span>Pesan sekarang</span>
                </button>
              </div>

              {/* {isLogin ? (
                  <FormBooking
                    className="bg-neutral-50 shadow-xl sm:overflow-hidden sm:rounded-md mb-6"
                    header={
                      <Fragment>
                        <p className="pb-6 text-3xl tracking-tight text-gray-900">
                          {product.price}
                        </p>

                        <div className="flex items-center">
                          <Rating
                            className="pb-6"
                            totalReview={2}
                            value={4.7}
                          />
                        </div>
                      </Fragment>
                    }
                  />
                ) : (
                  <FormLogin
                    header={
                      <Fragment>
                        <p className="pb-6 text-3xl tracking-tight text-gray-900">
                          {product.price}
                        </p>

                        <div className="flex items-center">
                          <Rating
                            className="pb-6"
                            totalReview={2}
                            value={4.7}
                          />
                        </div>

                        <h4 className="text-xl text-stone-700 pb-6">
                          Masuk untuk booking
                        </h4>
                      </Fragment>
                    }
                  />
                )}
              </div> */}

              <form className="mt-10">
                {/* Colors */}
                {/* <div>
                  <h3 className="text-sm font-medium text-gray-900">Color</h3>

                  <RadioGroup
                    value={selectedColor}
                    onChange={setSelectedColor}
                    className="mt-4"
                  >
                    <RadioGroup.Label className="sr-only">
                      {" "}
                      Choose a color{" "}
                    </RadioGroup.Label>
                    <div className="flex items-center space-x-3">
                      {product.colors.map((color) => (
                        <RadioGroup.Option
                          key={color.name}
                          value={color}
                          className={({ active, checked }) =>
                            classNames(
                              color.selectedClass,
                              active && checked ? "ring ring-offset-1" : "",
                              !active && checked ? "ring-2" : "",
                              "-m-0.5 relative p-0.5 rounded-full flex items-center justify-center cursor-pointer focus:outline-none"
                            )
                          }
                        >
                          <RadioGroup.Label as="span" className="sr-only">
                            {" "}
                            {color.name}{" "}
                          </RadioGroup.Label>
                          <span
                            aria-hidden="true"
                            className={classNames(
                              color.class,
                              "h-8 w-8 border border-black border-opacity-10 rounded-full"
                            )}
                          />
                        </RadioGroup.Option>
                      ))}
                    </div>
                  </RadioGroup>
                </div> */}

                {/* Sizes */}
                {/* <div className="mt-10">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-gray-900">Size</h3>
                    <a
                      href="#"
                      className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                    >
                      Size guide
                    </a>
                  </div>

                  <RadioGroup
                    value={selectedSize}
                    onChange={setSelectedSize}
                    className="mt-4"
                  >
                    <RadioGroup.Label className="sr-only">
                      {" "}
                      Choose a size{" "}
                    </RadioGroup.Label>
                    <div className="grid grid-cols-4 gap-4 sm:grid-cols-8 lg:grid-cols-4">
                      {product.sizes.map((size) => (
                        <RadioGroup.Option
                          key={size.name}
                          value={size}
                          disabled={!size.inStock}
                          className={({ active }) =>
                            classNames(
                              size.inStock
                                ? "bg-white shadow-sm text-gray-900 cursor-pointer"
                                : "bg-gray-50 text-gray-200 cursor-not-allowed",
                              active ? "ring-2 ring-indigo-500" : "",
                              "group relative border rounded-md py-3 px-4 flex items-center justify-center text-sm font-medium uppercase hover:bg-gray-50 focus:outline-none sm:flex-1 sm:py-6"
                            )
                          }
                        >
                          {({ active, checked }) => (
                            <>
                              <RadioGroup.Label as="span">
                                {size.name}
                              </RadioGroup.Label>
                              {size.inStock ? (
                                <span
                                  className={classNames(
                                    active ? "border" : "border-2",
                                    checked
                                      ? "border-indigo-500"
                                      : "border-transparent",
                                    "pointer-events-none absolute -inset-px rounded-md"
                                  )}
                                  aria-hidden="true"
                                />
                              ) : (
                                <span
                                  aria-hidden="true"
                                  className="pointer-events-none absolute -inset-px rounded-md border-2 border-gray-200"
                                >
                                  <svg
                                    className="absolute inset-0 h-full w-full stroke-2 text-gray-200"
                                    viewBox="0 0 100 100"
                                    preserveAspectRatio="none"
                                    stroke="currentColor"
                                  >
                                    <line
                                      x1={0}
                                      y1={100}
                                      x2={100}
                                      y2={0}
                                      vectorEffect="non-scaling-stroke"
                                    />
                                  </svg>
                                </span>
                              )}
                            </>
                          )}
                        </RadioGroup.Option>
                      ))}
                    </div>
                  </RadioGroup>
                </div> */}

                {/* <button
                  type="submit"
                  className="mt-10 flex w-full items-center justify-center rounded-md border border-transparent bg-indigo-600 py-3 px-8 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  Add to bag
                </button> */}
              </form>
            </div>
          </div>

          <div className="py-10 lg:col-span-2 lg:col-start-1 lg:border-r lg:border-gray-200 lg:pt-6 lg:pb-16 lg:pr-8">
            {/* Description and details */}
            <TabsGeneral
              data={{
                Description: {
                  id: 1,
                  component: (
                    <Fragment>
                      <div>
                        <h3 className="sr-only">Description</h3>

                        <div className="space-y-6">
                          <p className="text-base text-gray-900">
                            {product.description}
                          </p>
                        </div>
                      </div>

                      <div className="mt-10">
                        <h3 className="text-sm font-medium text-gray-900">
                          Highlights
                        </h3>

                        <div className="mt-4">
                          <ul
                            role="list"
                            className="list-disc space-y-2 pl-4 text-sm"
                          >
                            {product.highlights.map((highlight) => (
                              <li key={highlight} className="text-gray-400">
                                <span className="text-gray-900">
                                  {highlight}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <div className="mt-10">
                        <h2 className="text-sm font-medium text-gray-900">
                          Details
                        </h2>

                        <div className="mt-4 space-y-6">
                          <p className="text-base text-gray-900">
                            {product.details}
                          </p>
                        </div>
                      </div>

                      <div className="text-base text-gray-900">
                        <p className="mt-4">
                          Lorem ipsum dolor sit amet consectetur adipisicing
                          elit. Obcaecati dolores cumque, numquam suscipit ab
                          sed dignissimos repudiandae maxime dicta, hic,
                          consectetur rerum. Numquam natus, tempore quidem quae
                          libero consequuntur ipsam!
                        </p>
                        <p className="mt-4">
                          Lorem ipsum dolor sit amet consectetur adipisicing
                          elit. Tempora fugiat iure aperiam quia quas quod
                          voluptatum? Ex sequi aut quibusdam tempore eum iusto
                          ipsum molestias officiis quisquam, numquam minima
                          recusandae?
                        </p>
                        <p className="mt-4">
                          Lorem ipsum dolor sit amet consectetur adipisicing
                          elit. Fugit, cumque voluptatem perferendis architecto
                          debitis voluptas similique, ad maiores excepturi,
                          totam incidunt itaque! Ex nesciunt repudiandae vero
                          quisquam consequuntur eligendi accusantium.
                        </p>
                        <p className="mt-4">
                          Lorem ipsum dolor sit amet consectetur adipisicing
                          elit. Obcaecati dolores cumque, numquam suscipit ab
                          sed dignissimos repudiandae maxime dicta, hic,
                          consectetur rerum. Numquam natus, tempore quidem quae
                          libero consequuntur ipsam!
                        </p>
                        <p className="mt-4">
                          Lorem ipsum dolor sit amet consectetur adipisicing
                          elit. Tempora fugiat iure aperiam quia quas quod
                          voluptatum? Ex sequi aut quibusdam tempore eum iusto
                          ipsum molestias officiis quisquam, numquam minima
                          recusandae?
                        </p>
                        <p className="mt-4">
                          Lorem ipsum dolor sit amet consectetur adipisicing
                          elit. Fugit, cumque voluptatem perferendis architecto
                          debitis voluptas similique, ad maiores excepturi,
                          totam incidunt itaque! Ex nesciunt repudiandae vero
                          quisquam consequuntur eligendi accusantium.
                        </p>
                        <p className="mt-4">
                          Lorem ipsum dolor sit amet consectetur adipisicing
                          elit. Obcaecati dolores cumque, numquam suscipit ab
                          sed dignissimos repudiandae maxime dicta, hic,
                          consectetur rerum. Numquam natus, tempore quidem quae
                          libero consequuntur ipsam!
                        </p>
                        <p className="mt-4">
                          Lorem ipsum dolor sit amet consectetur adipisicing
                          elit. Tempora fugiat iure aperiam quia quas quod
                          voluptatum? Ex sequi aut quibusdam tempore eum iusto
                          ipsum molestias officiis quisquam, numquam minima
                          recusandae?
                        </p>
                        <p className="mt-4">
                          Lorem ipsum dolor sit amet consectetur adipisicing
                          elit. Fugit, cumque voluptatem perferendis architecto
                          debitis voluptas similique, ad maiores excepturi,
                          totam incidunt itaque! Ex nesciunt repudiandae vero
                          quisquam consequuntur eligendi accusantium.
                        </p>
                        <p className="mt-4">
                          Lorem ipsum dolor sit amet consectetur adipisicing
                          elit. Obcaecati dolores cumque, numquam suscipit ab
                          sed dignissimos repudiandae maxime dicta, hic,
                          consectetur rerum. Numquam natus, tempore quidem quae
                          libero consequuntur ipsam!
                        </p>
                        <p className="mt-4">
                          Lorem ipsum dolor sit amet consectetur adipisicing
                          elit. Tempora fugiat iure aperiam quia quas quod
                          voluptatum? Ex sequi aut quibusdam tempore eum iusto
                          ipsum molestias officiis quisquam, numquam minima
                          recusandae?
                        </p>
                        <p className="mt-4">
                          Lorem ipsum dolor sit amet consectetur adipisicing
                          elit. Fugit, cumque voluptatem perferendis architecto
                          debitis voluptas similique, ad maiores excepturi,
                          totam incidunt itaque! Ex nesciunt repudiandae vero
                          quisquam consequuntur eligendi accusantium.
                        </p>
                      </div>
                    </Fragment>
                  ),
                },
                Schedule: {
                  id: 2,
                  component: (
                    <div>
                      {product.schedules[0].data.map(
                        (schedule, scheduleIndex) => {
                          return (
                            <LabelCheckpoint
                              fontSize={16}
                              key={`${product.schedules[0].name}-${schedule.time}`}
                              path={{
                                top: { color: "#ccc", size: 20 },
                                bottom: { color: "#ccc", size: 14 },
                              }}
                              text={`${schedule.time} ${schedule.activity}`}
                              {...generateLabelCheckpointProps(
                                scheduleIndex,
                                0,
                                product.schedules[0].data.length - 1
                              )}
                            />
                          );
                        }
                      )}
                    </div>
                  ),
                },
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
