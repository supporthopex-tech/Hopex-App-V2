export function AuthBrandPanel(_props: { title?: string; subtitle?: string } = {}) {
  void _props;
  return (
    <div className="hidden min-h-[620px] place-items-center rounded-l-lg border-r bg-slate-950 p-10 lg:grid">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/company-logo.svg" alt="Hopex Express Cargo logo" className="h-auto w-full max-w-sm object-contain" />
    </div>
  );
}
