import { TabList } from "./NavTabList";

export function Nav() {
  return (
    <nav className="flex flex-col drop-shadow justify-end h-[100vh] px-8 py-4 min-w-60 bg-gradient-to-br from-cyan-500 to-blue-500">
      <p className="text-center text-[5rem] font-semibold bg-clip-text text-white">fAm</p>
      <div className="relative h-full mt-2">
        <TabList />
      </div>
    </nav>
  );
}
