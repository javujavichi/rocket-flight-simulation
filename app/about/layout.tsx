import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About - Rocket Flight Digital Twin",
  description:
    "Learn about the technical background, physics equations, and architecture behind the real-time rocket flight simulation system inspired by NASA mission control.",
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
