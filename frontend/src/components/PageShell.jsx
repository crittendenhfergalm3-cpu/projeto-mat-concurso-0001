export const PageShell = ({ title, subtitle, children }) => (
  <div className="bg-gray-50">
    <div className="border-b border-gray-200 bg-white">
      <div className="mx-auto max-w-4xl px-4 py-10">
        <h1 className="font-display text-3xl font-bold text-gray-900 md:text-4xl">{title}</h1>
        {subtitle && <p className="mt-2 text-gray-500">{subtitle}</p>}
      </div>
    </div>
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="space-y-4 text-[15px] leading-relaxed text-gray-600 [&_a]:font-medium [&_a]:text-emerald-600 [&_a:hover]:underline [&_h2]:mb-2 [&_h2]:mt-8 [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-gray-900 [&_li]:ml-1 [&_strong]:text-gray-900 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5">
        {children}
      </div>
    </div>
  </div>
);
