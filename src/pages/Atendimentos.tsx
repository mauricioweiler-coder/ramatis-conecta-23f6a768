import AtendimentoIndividual from "@/components/atendimento/AtendimentoIndividual";

export default function Atendimentos() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground md:text-3xl">Atendimentos</h1>
        <p className="text-muted-foreground">Gestão de atendimentos individuais e acompanhamento de atendidos</p>
      </div>
      <AtendimentoIndividual />
    </div>
  );
}
