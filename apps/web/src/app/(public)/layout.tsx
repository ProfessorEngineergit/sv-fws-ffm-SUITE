import PublicHeader from "@/components/PublicHeader";
import Footer from "@/components/Footer";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PublicHeader />
      <main className="min-h-[70vh]">{children}</main>
      <Footer />
    </>
  );
}
