import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarDays, Settings2 } from "lucide-react";
import SpiritualSessionsTab from "@/components/atendimento/SpiritualSessionsTab";
import ServiceTypesTab from "@/components/atendimento/ServiceTypesTab";
import { useCurrentUserRole } from "@/hooks/useCurrentUserRole";

export default function Atendimento() {
  const [tab, setTab] = useState("sessoes");
  const { isAdminOrDiretor } = useCurrentUserRole();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground md:text-3xl">Atendimento Espiritual</h1>
        <p className="text-muted-foreground">Sessões coletivas e tipos de atendimento</p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="sessoes" className="gap-2">
            <CalendarDays className="h-4 w-4" />
            <span className="hidden sm:inline">Sessões</span>
          </TabsTrigger>
          {isAdminOrDiretor && (
            <TabsTrigger value="tipos" className="gap-2">
              <Settings2 className="h-4 w-4" />
              <span className="hidden sm:inline">Tipos</span>
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="sessoes" className="mt-6">
          <SpiritualSessionsTab />
        </TabsContent>
        {isAdminOrDiretor && (
          <TabsContent value="tipos" className="mt-6">
            <ServiceTypesTab />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
