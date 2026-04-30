import Link from "next/link";
import StatusBadge from "@/components/super-admin/StatusBadge";
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
    <aside className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:rounded-none md:border-0 md:border-r md:shadow-none">
      <div className="mb-6">
        <p className="text-sm font-semibold text-slate-900">DaVinci Interview</p>
        <div className="mt-1">
          <StatusBadge tone="blue">Super Admin</StatusBadge>
        </div>
      </div>

      <nav className="space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = active === item.key;
          return (
            <Link
              key={item.key}
              href={item.href}
              className={`flex items-center rounded-xl px-3 py-2 text-sm transition ${isActive ? "bg-indigo-100 text-indigo-700" : "text-slate-600 hover:bg-slate-100"}`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto pt-4">
        <SuperAdminLogoutButton />
      </div>
    </aside>
  );
}
