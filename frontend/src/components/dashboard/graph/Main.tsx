"use client";

export function Main() {
  return (
    <div className="min-h-[100vh] w-full flex flex-row bg-gray-100 ">
      <div className="w-[80%] p-4 overflow-y-auto">
        <canvas id="graph-canvas" className="w-full h-full" />
      </div>
      <div className="w-[20%] rounded-xl shadow bg-white p-4">状态栏</div>
    </div>
  );
}
