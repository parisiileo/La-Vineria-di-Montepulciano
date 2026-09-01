// Layout radice di passaggio: html e body vivono in app/[locale]/layout.tsx,
// dove la lingua del documento e nota.

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
