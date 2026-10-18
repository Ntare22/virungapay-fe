import type { Metadata } from "next";
import { Open_Sans, Roboto_Mono } from "next/font/google";
import { DeviceGate } from "./components/device-gate";
import { NavPreferenceProvider } from "./components/dashboard-shell";
import "./globals.css";

const openSans = Open_Sans({
  variable: "--font-open-sans",
  subsets: ["latin"],
});

const robotoMono = Roboto_Mono({
  variable: "--font-roboto-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "VirungaPay",
  description:
    "Tour operators send an itinerary. Tourists pay by card in USD. The operator then pays lodges, drivers, fuel, and guides.",
  icons: {
    icon: [
      { url: "/favicon-light.png", media: "(prefers-color-scheme: light)", type: "image/png" },
      { url: "/favicon-dark.png", media: "(prefers-color-scheme: dark)", type: "image/png" },
    ],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${openSans.variable} ${robotoMono.variable} h-full scroll-smooth antialiased`}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col font-sans text-body">
        <DeviceGate>
          <NavPreferenceProvider>{children}</NavPreferenceProvider>
        </DeviceGate>
      </body>
    </html>
  );
}
