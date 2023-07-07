import {
  ButtonHTMLAttributes,
  DependencyList,
  Fragment,
  HTMLAttributes,
  useEffect,
  useState,
} from "react";

import { Dialog, Transition } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/20/solid";

const Modal: React.FC<
  {
    buttonModal: React.FC<ButtonHTMLAttributes<HTMLButtonElement>>;
    classNameButton?: string;
    classNamePanel?: string;
    closeIconClassName?: string;
    dependencyListCloseModal?: DependencyList;
    heading?: string | React.ReactElement;
  } & HTMLAttributes<HTMLDivElement>
> = ({
  buttonModal: ButtonModal,
  children,
  classNamePanel = "w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all",
  closeIconClassName = "",
  heading,
  dependencyListCloseModal = [],
}) => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setIsOpen(false);
  }, [dependencyListCloseModal]);

  return (
    <>
      {ButtonModal && <ButtonModal onClick={() => setIsOpen(true)} />}

      <Transition appear show={isOpen} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-30"
          onClose={() => setIsOpen(false)}
        >
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
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
                <Dialog.Panel className={classNamePanel}>
                  <header>
                    {heading && (
                      <Dialog.Title
                        as="h3"
                        className="text-lg font-medium leading-6 text-gray-900"
                      >
                        {heading}
                      </Dialog.Title>
                    )}

                    <button
                      className={closeIconClassName}
                      onClick={(e) => setIsOpen(false)}
                      type="button"
                    >
                      <XMarkIcon height={32} width={32} />
                    </button>
                  </header>

                  {children}
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );
};

export default Modal;
