export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="grid min-h-screen place-items-center bg-muted/40 p-4">
      <div className="w-full">{children}</div>
    </main>
  );
}
