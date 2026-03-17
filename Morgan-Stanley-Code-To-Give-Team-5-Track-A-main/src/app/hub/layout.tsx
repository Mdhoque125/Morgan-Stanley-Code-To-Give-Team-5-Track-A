export default function HubLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="font-sans text-sm">
      {children}
    </div>
  );
}
