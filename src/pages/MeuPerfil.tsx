import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Loader2, Save, Camera, User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const maskCpf = (v: string) =>
  v.replace(/\D/g, "").slice(0, 11)
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");

const maskPhone = (v: string) =>
  v.replace(/\D/g, "").slice(0, 11)
    .replace(/(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d{1,4})$/, "$1-$2");

const maskCep = (v: string) =>
  v.replace(/\D/g, "").slice(0, 8)
    .replace(/(\d{5})(\d{1,3})$/, "$1-$2");

interface ProfileForm {
  full_name: string;
  email: string;
  role: string;
  cpf: string;
  mobile_phone: string;
  whatsapp: string;
  cep: string;
  address_street: string;
  address_number: string;
  address_complement: string;
  address_neighborhood: string;
  address_state: string;
  address_city: string;
  address_country: string;
  profile_completed: boolean;
  profile_photo_url: string;
}

const initialForm: ProfileForm = {
  full_name: "", email: "", role: "", cpf: "", mobile_phone: "", whatsapp: "",
  cep: "", address_street: "", address_number: "", address_complement: "",
  address_neighborhood: "", address_state: "", address_city: "", address_country: "Brasil",
  profile_completed: false, profile_photo_url: "",
};

export default function MeuPerfil() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadingCep, setLoadingCep] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [form, setForm] = useState<ProfileForm>({ ...initialForm });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isFirstLogin = !form.profile_completed;
  const fromRedirect = location.state?.firstLogin === true;

  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      if (!error && data) {
        setForm({
          full_name: data.full_name || "",
          email: data.email || user.email || "",
          role: data.role || "",
          cpf: (data as any).cpf || "",
          mobile_phone: (data as any).mobile_phone || "",
          whatsapp: (data as any).whatsapp || "",
          cep: (data as any).cep || "",
          address_street: (data as any).address_street || "",
          address_number: (data as any).address_number || "",
          address_complement: (data as any).address_complement || "",
          address_neighborhood: (data as any).address_neighborhood || "",
          address_state: (data as any).address_state || "",
          address_city: (data as any).address_city || "",
          address_country: (data as any).address_country || "Brasil",
          profile_completed: (data as any).profile_completed ?? false,
          profile_photo_url: (data as any).profile_photo_url || "",
        });
      }
      setLoading(false);
    };
    fetchProfile();
  }, [user]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Selecione um arquivo de imagem");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 5MB");
      return;
    }

    setUploadingPhoto(true);
    try {
      const ext = file.name.split(".").pop();
      const filePath = `${user.id}/profile.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("user_photos")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("user_photos")
        .getPublicUrl(filePath);

      const photoUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      await supabase
        .from("profiles")
        .update({ profile_photo_url: photoUrl } as any)
        .eq("id", user.id);

      setForm((prev) => ({ ...prev, profile_photo_url: photoUrl }));
      toast.success("Foto atualizada com sucesso!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao enviar foto");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const updateField = (field: keyof ProfileForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const updateMasked = (field: keyof ProfileForm, value: string, mask: (v: string) => string) => {
    setForm((prev) => ({ ...prev, [field]: mask(value) }));
  };

  const handleCepBlur = async () => {
    const cepClean = form.cep.replace(/\D/g, "");
    if (cepClean.length !== 8) return;
    setLoadingCep(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cepClean}/json/`);
      const data = await res.json();
      if (data.erro) { toast.error("CEP não encontrado"); return; }
      setForm((prev) => ({
        ...prev,
        address_street: data.logradouro || "",
        address_neighborhood: data.bairro || "",
        address_city: data.localidade || "",
        address_state: data.uf || "",
        address_country: "Brasil",
      }));
    } catch { toast.error("Erro ao buscar CEP"); }
    finally { setLoadingCep(false); }
  };

  const handleSave = async () => {
    if (!user) return;
    if (!form.full_name.trim()) { toast.error("Informe seu nome completo"); return; }
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: form.full_name,
          cpf: form.cpf || null,
          mobile_phone: form.mobile_phone || null,
          whatsapp: form.whatsapp || null,
          cep: form.cep || null,
          address_street: form.address_street || null,
          address_number: form.address_number || null,
          address_complement: form.address_complement || null,
          address_neighborhood: form.address_neighborhood || null,
          address_state: form.address_state || null,
          address_city: form.address_city || null,
          address_country: form.address_country || null,
          profile_completed: true,
        } as any)
        .eq("id", user.id);
      if (error) throw error;
      setForm((p) => ({ ...p, profile_completed: true }));
      toast.success("Perfil atualizado com sucesso!");
      if (fromRedirect) navigate("/", { replace: true });
    } catch (e: any) {
      toast.error(e.message || "Erro ao salvar perfil");
    } finally { setSaving(false); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground md:text-3xl">Meu Perfil</h1>
        <p className="text-muted-foreground">
          {isFirstLogin && fromRedirect
            ? "Complete seu cadastro para continuar"
            : "Gerencie suas informações pessoais"}
        </p>
        {isFirstLogin && fromRedirect && (
          <Badge variant="outline" className="mt-2 bg-primary/10 text-primary border-primary/20">
            Primeiro acesso — preencha seus dados
          </Badge>
        )}
      </div>

      {/* Foto do Perfil */}
      <Card>
        <CardHeader>
          <CardTitle>Foto do Perfil</CardTitle>
          <CardDescription>Esta foto será utilizada para reconhecimento facial no registro de presença</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          <Avatar className="h-32 w-32 border-2 border-border">
            {form.profile_photo_url ? (
              <AvatarImage src={form.profile_photo_url} alt="Foto de perfil" />
            ) : null}
            <AvatarFallback className="text-3xl">
              <User className="h-12 w-12" />
            </AvatarFallback>
          </Avatar>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handlePhotoUpload}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingPhoto}
          >
            {uploadingPhoto ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Camera className="mr-2 h-4 w-4" />
            )}
            {form.profile_photo_url ? "Alterar Foto" : "Enviar Foto"}
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            Envie uma foto nítida do rosto, de frente, com boa iluminação. Máx. 5MB.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Informações Pessoais</CardTitle>
          <CardDescription>Atualize seus dados cadastrais</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Nome + Email */}
          <div className="grid gap-2">
            <Label>Nome Completo *</Label>
            <Input placeholder="Seu nome completo" value={form.full_name} onChange={(e) => updateField("full_name", e.target.value)} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>E-mail</Label>
              <Input value={form.email} disabled className="opacity-70" />
            </div>
            <div className="grid gap-2">
              <Label>Papel / Role</Label>
              <Input value={form.role || "—"} disabled className="opacity-70" />
            </div>
          </div>

          {/* CPF */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>CPF</Label>
              <Input placeholder="000.000.000-00" value={form.cpf} onChange={(e) => updateMasked("cpf", e.target.value, maskCpf)} />
            </div>
          </div>

          {/* Telefone + WhatsApp */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Telefone</Label>
              <Input placeholder="(00) 00000-0000" value={form.mobile_phone} onChange={(e) => updateMasked("mobile_phone", e.target.value, maskPhone)} />
            </div>
            <div className="grid gap-2">
              <Label>WhatsApp</Label>
              <Input placeholder="(00) 00000-0000" value={form.whatsapp} onChange={(e) => updateMasked("whatsapp", e.target.value, maskPhone)} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Endereço</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* CEP + Endereço */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="grid gap-2">
              <Label>CEP</Label>
              <div className="relative">
                <Input placeholder="00000-000" value={form.cep} onChange={(e) => updateMasked("cep", e.target.value, maskCep)} onBlur={handleCepBlur} />
                {loadingCep && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />}
              </div>
            </div>
            <div className="grid gap-2 sm:col-span-2">
              <Label>Endereço</Label>
              <Input placeholder="Rua, Avenida..." value={form.address_street} onChange={(e) => updateField("address_street", e.target.value)} />
            </div>
          </div>

          {/* Nº + Complemento + Bairro */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="grid gap-2">
              <Label>Nº</Label>
              <Input placeholder="123" value={form.address_number} onChange={(e) => updateField("address_number", e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Complemento</Label>
              <Input placeholder="Apto, Bloco..." value={form.address_complement} onChange={(e) => updateField("address_complement", e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Bairro</Label>
              <Input placeholder="Bairro" value={form.address_neighborhood} onChange={(e) => updateField("address_neighborhood", e.target.value)} />
            </div>
          </div>

          {/* Cidade + Estado + País */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="grid gap-2">
              <Label>Cidade</Label>
              <Input placeholder="Cidade" value={form.address_city} onChange={(e) => updateField("address_city", e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Estado</Label>
              <Input placeholder="UF" value={form.address_state} onChange={(e) => updateField("address_state", e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>País</Label>
              <Input placeholder="País" value={form.address_country} onChange={(e) => updateField("address_country", e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
        {isFirstLogin && fromRedirect ? "Completar Cadastro" : "Salvar Alterações"}
      </Button>
    </div>
  );
}
