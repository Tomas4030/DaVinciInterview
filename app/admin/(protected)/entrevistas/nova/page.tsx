// app/admin/(protected)/entrevistas/nova/page.tsx
import EntrevistaForm from "@/components/admin/EntrevistaForm";
import type { Metadata } from "next";

export const dynamic = "force-dynamic"; // Cookies no middleware
export const metadata: Metadata = { title: "Admin — Nova entrevista" };

export default function NovaEntrevistaPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Nova entrevista</h1>
        <p className="text-sm text-gray-500 mt-1">
          Cria uma nova vaga com as suas perguntas
        </p>
      </div>
      <EntrevistaForm />
    </div>
  );
}
