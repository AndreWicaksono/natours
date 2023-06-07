import {
  DetailedHTMLProps,
  ElementType,
  Fragment,
  HTMLAttributes,
  useState,
} from "react";

import { StyledComponent } from "@emotion/styled";
import { SerializedStyles, Theme } from "@emotion/react";

import { Dialog, Transition } from "@headlessui/react";
import { Squares2X2Icon, XMarkIcon } from "@heroicons/react/24/outline";

import CarouselSimpleGallery from "components/Organisms/Carousel/CarouselSimpleGallery/CarouselSimpleGallery";
import { ButtonViewPhotos } from "components/Organisms/PhotoGallery/GridPhotoGallery.css";

import { ButtonClose } from "./ModalPhotoGallery.css";

interface IModalPhotoGallery {
  Button?: StyledComponent<
    {
      theme?: Theme | undefined;
      as?: ElementType<any> | undefined;
    },
    DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement>,
    {}
  > | null;
  css?: {
    button: string | SerializedStyles;
  };
}

const ModalPhotoGallery: React.FC<IModalPhotoGallery> = ({ Button, css }) => {
  let [isOpen, setIsOpen] = useState(false);

  function closeModal() {
    setIsOpen(false);
  }

  function openModal() {
    setIsOpen(true);
  }

  return (
    <>
      {Button ? (
        <Button>
          <ButtonViewPhotos type="button" onClick={openModal}>
            <Squares2X2Icon
              className="mr-1"
              height={20}
              width={20}
              strokeWidth={1.5}
            />
            <span className="pt-0.5">View All Photos</span>
          </ButtonViewPhotos>
        </Button>
      ) : (
        <ButtonViewPhotos
          css={css && css?.button ? css?.button : ""}
          type="button"
          onClick={openModal}
        >
          <Squares2X2Icon
            className="mr-1"
            height={20}
            width={20}
            strokeWidth={1}
          />
          <span className="pt-0.5">View All Photos</span>
        </ButtonViewPhotos>
      )}

      <Transition appear show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-30" onClose={closeModal}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel
                  className="h-screen w-full transform bg-black text-left align-middle shadow-xl transition-all"
                  style={{
                    backgroundImage:
                      "linear-gradient( to bottom right, rgba(125, 213, 111, 0.85), rgba(40, 180, 135, 0.85) )",
                  }}
                >
                  <div className="flex items-center justify-between mb-10 p-4 md:p-6">
                    <Dialog.Title
                      as="h3"
                      className="capitalize text-sm md:text-lg leading-6 text-neutral-50"
                    >
                      Pangandaran Private Tour
                    </Dialog.Title>

                    <ButtonClose onClick={() => setIsOpen(false)}>
                      <XMarkIcon
                        color="#fff"
                        height={32}
                        width={32}
                        strokeWidth={1}
                      />
                    </ButtonClose>
                  </div>

                  <div className="container mx-auto">
                    <div className="mt-2">
                      <CarouselSimpleGallery />
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );
};

export default ModalPhotoGallery;
