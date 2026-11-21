import { Suspense } from "react";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Navbar reads the current path, so dynamic routes need a Suspense boundary */}
      <Suspense fallback={<div className="fixed top-0 left-0 right-0 z-50 h-16.25 border-b border-gray-200 bg-white" />}>
        <Navbar />
      </Suspense>
      {/* The Navbar is fixed (64px bar + 1px border), so push the page down by the same amount */}
      <div className="flex-1 bg-[#f7f8f8] pt-16.25">{children}</div>
      <Footer />
    </>
  );
}
