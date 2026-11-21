import { Suspense } from "react";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Navbar reads the current path, so dynamic routes need a Suspense boundary */}
      <Suspense fallback={<div className="h-16 border-b border-gray-200 bg-white" />}>
        <Navbar />
      </Suspense>
      <div className="flex-1 bg-[#f7f8f8]">{children}</div>
      <Footer />
    </>
  );
}
