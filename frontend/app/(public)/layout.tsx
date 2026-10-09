// app/(public)/layout.tsx
// Hosts the @modal parallel route slot so intercepted navigation to
// /eventos/[slug] can render on top of the current (public) route without
// unmounting it. Each (public) page still renders its own Navbar/Footer.

export default function PublicLayout({
  children,
  modal,
}: {
  children: React.ReactNode
  modal: React.ReactNode
}) {
  return (
    <>
      {children}
      {modal}
    </>
  )
}
