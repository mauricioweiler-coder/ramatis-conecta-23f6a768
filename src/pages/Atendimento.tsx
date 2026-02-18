import SpiritualSessionsTab from "@/components/atendimento/SpiritualSessionsTab";

export default function Atendimento() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground md:text-3xl">Atendimento Espiritual</h1>
        <p className="text-muted-foreground">Sessões coletivas de atendimento espiritual</p>
      </div>
      <SpiritualSessionsTab />
    </div>
  );
}
