import { Tab } from "@headlessui/react";

function classNames(...classes: any[]) {
  return classes.filter(Boolean).join(" ");
}

const TabGeneral: React.FC<{
  data: { [key: string]: { id: number; component: React.ReactElement } };
}> = ({ data }) => {
  if (!data) return null;

  return (
    <div className="w-full pb-16 sm:px-0">
      <Tab.Group>
        <Tab.List className="flex rounded-xl p-1">
          {Object.keys(data).map((tabName) => (
            <Tab
              key={tabName}
              className={({ selected }) =>
                classNames(
                  "w-full py-2.5 text-sm font-medium leading-5 text-gray-900",
                  "border-b-2 focus:outline-none",
                  selected
                    ? "font-bold text-green-500 border-green-500"
                    : "hover:bg-white/[0.12]"
                )
              }
            >
              {tabName}
            </Tab>
          ))}
        </Tab.List>

        <Tab.Panels className="mt-2">
          {Object.values(data).map((tabPanel, idx) => (
            <Tab.Panel
              key={idx}
              className={classNames(
                "rounded-xl bg-white py-3",
                "focus:outline-none"
              )}
            >
              <ul>
                <li key={tabPanel.id} className="relative">
                  {tabPanel.component}
                </li>
              </ul>
            </Tab.Panel>
          ))}
        </Tab.Panels>
      </Tab.Group>
    </div>
  );
};

export default TabGeneral;
