// app/page.tsx
import { listarVagasAtivas, type VagaResumo } from "@/lib/api";
import {
  Header,
  HeroSection,
  VagasSection,
  HowItWorksSection,
  Footer,
} from "@/components/home";

export default async function HomePage() {
  let vagas: VagaResumo[] = [];

  try {
    vagas = await listarVagasAtivas();
  } catch {
    vagas = [];
  }

  return (
    <main className="min-h-screen bg-[var(--c-bg)]">
      <Header />
      <HeroSection />
      <VagasSection vagas={vagas} />
      <HowItWorksSection />
      <Footer />
    </main>
  );
}
