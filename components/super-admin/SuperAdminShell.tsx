import SuperAdminSidebar from "@/components/super-admin/SuperAdminSidebar";

type Section = "overview" | "companies" | "ai-usage" | "admins";

type Props = {
  active: Section;
  children: React.ReactNode;
};

export default function SuperAdminShell({ active, children }: Props) {
  return (
    <main className="min-h-screen w-full bg-[#f7f8fc]">
      <div className="grid min-h-screen w-full grid-cols-1 lg:grid-cols-[260px,1fr]">
        <SuperAdminSidebar active={active} />
        <section className="min-w-0 px-4 py-6 md:px-8 lg:px-10 xl:px-12">
          {children}
        </section>
      </div>
    </main>
  );
}
