import SuperAdminSidebar from "@/components/super-admin/SuperAdminSidebar";

type Section = "overview" | "companies" | "ai-usage" | "admins";

type Props = {
  active: Section;
  children: React.ReactNode;
};

export default function SuperAdminShell({ active, children }: Props) {
  return (
    <main className="min-h-screen bg-[#f7f8fc] p-4 md:p-0">
      <div className="mx-auto grid min-h-screen w-full max-w-[1600px] gap-4 md:grid-cols-[240px,1fr] md:gap-0">
        <SuperAdminSidebar active={active} />
        <section className="p-2 md:p-8">{children}</section>
      </div>
    </main>
  );
}
