import Link from "next/link";
import SuperAdminLogoutButton from "@/components/super-admin/SuperAdminLogoutButton";

type Section = "overview" | "companies" | "ai-usage" | "admins";

type Props = {
  active: Section;
};

const NAV_ITEMS: Array<{ key: Section; href: string; label: string }> = [
  { key: "overview", href: "/super-admin", label: "Overview" },
  { key: "companies", href: "/super-admin/companies", label: "Companies" },
  { key: "ai-usage", href: "/super-admin/ai-usage", label: "AI Usage" },
  { key: "admins", href: "/super-admin/admins", label: "Admins" },
];

export default function SuperAdminSidebar({ active }: Props) {
  return (
    <aside className="sticky top-0 hidden h-screen border-r border-[#eaeaea] bg-[#fbfbfa] px-5 py-6 lg:flex lg:flex-col">
      <div className="mb-10">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#111111] text-xs font-bold text-white">
            D
          </span>
          <div>
            <p className="text-sm font-semibold tracking-tight text-[#111111]">
              DaVinci Interview
            </p>
            <p className="mt-1 inline-flex rounded-full bg-[#e1f3fe] px-2 py-0.5 text-[11px] font-medium uppercase tracking-[0.05em] text-[#1f6c9f]">
              Super Admin
            </p>
          </div>
        </div>
      </div>

      <nav className="space-y-1.5">
        {NAV_ITEMS.map((item) => {
          const isActive = active === item.key;

          return (
            <Link
              key={item.key}
              href={item.href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-indigo-100 text-indigo-700"
                  : "text-[#787774] hover:bg-white hover:text-[#111111]"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto">
        <SuperAdminLogoutButton />
      </div>
    </aside>
  );
}
