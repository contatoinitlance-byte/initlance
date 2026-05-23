import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { User, Camera, Loader2, CheckCircle } from 'lucide-react';
import { Input } from '@/Components/ui/input';
import { Button } from '@/Components/ui/button';
import { Label } from '@/Components/ui/label';
import { db } from '@/api/supabaseData';
import { uploadProfileImage } from '@/api/profileImage';
import supabase from '@/api/supabaseClient';
import { fetchCities, fetchCountries } from '@/api/locations';

const formatPhone = (value) => {
  const digits = String(value || '').replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
};

const toSkillText = (value) => {
  if (Array.isArray(value)) return value.join(', ');
  return String(value || '');
};

export default function DashboardSettings() {
  const { user, checkUserAuth } = useAuth();
  const fileRef = useRef(null);

  const [form, setForm] = useState({
    full_name: '',
    bio: '',
    cidade: '',
    pais: '',
    telefone: '',
    nome_empresa: '',
    site_empresa: '',
  });
  const [statsForm, setStatsForm] = useState({
    profissao: '',
    habilidades: '',
    valor_hora: '',
    valor_a_combinar: false,
  });
  const [countries, setCountries] = useState([]);
  const [cities, setCities] = useState([]);
  const [loadingCountries, setLoadingCountries] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);
  const [foto, setFoto] = useState(null);
  const [profile, setProfile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user?.email) return;
    loadProfile();
  }, [user?.email]);

  useEffect(() => {
    let active = true;
    setLoadingCountries(true);
    fetchCountries().then((items) => {
      if (active) setCountries(items);
    }).finally(() => {
      if (active) setLoadingCountries(false);
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    if (!form.pais) {
      setCities([]);
      return () => { active = false; };
    }

    setLoadingCities(true);
    fetchCities(form.pais).then((items) => {
      if (active) setCities(items);
    }).finally(() => {
      if (active) setLoadingCities(false);
    });
    return () => { active = false; };
  }, [form.pais]);

  const loadProfile = async () => {
    setError('');
    try {
      const [profileData, statsData] = await Promise.all([
        db.users.byId(user.id).then((row) => row || db.users.byEmail(user.email)),
        db.freelancerStats.byEmail(user.email),
      ]);

      const metadata = user.user_metadata || {};
      setProfile(profileData);
      setForm({
        full_name: profileData?.full_name || metadata.full_name || metadata.name || '',
        bio: profileData?.bio || metadata.bio || '',
        cidade: profileData?.cidade || metadata.cidade || '',
        pais: profileData?.pais || metadata.pais || '',
        telefone: formatPhone(profileData?.telefone || metadata.telefone || ''),
        nome_empresa: profileData?.nome_empresa || metadata.nome_empresa || '',
        site_empresa: profileData?.site_empresa || metadata.site_empresa || '',
      });
      setFoto(profileData?.foto_perfil || profileData?.avatar_url || metadata.foto_perfil || metadata.avatar_url || null);
      setStatsForm({
        profissao: statsData?.profissao || '',
        habilidades: toSkillText(statsData?.habilidades),
        valor_hora: statsData?.valor_hora ? String(statsData.valor_hora) : '',
        valor_a_combinar: Boolean(statsData?.valor_a_combinar),
      });
    } catch (err) {
      console.error('Settings profile load error:', err);
      setError(err instanceof Error ? err.message : 'Não foi possível carregar seu perfil.');
    }
  };

  const handlePhotoUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError('');
    try {
      const url = await uploadProfileImage(file, user.email);
      setFoto(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível carregar a imagem.');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    setError('');

    try {
      const targetRole = user?.role || profile?.role || user?.user_metadata?.role || 'freelancer';
      const authSafePhoto = typeof foto === 'string' && /^https?:\/\//i.test(foto) ? foto : undefined;
      const profilePayload = {
        id: user.id,
        email: user.email,
        full_name: form.full_name,
        bio: form.bio,
        cidade: form.cidade,
        pais: form.pais,
        telefone: form.telefone,
        nome_empresa: form.nome_empresa,
        site_empresa: form.site_empresa,
        foto_perfil: foto,
        avatar_url: foto,
        role: targetRole,
      };
      const savedProfile = await db.users.upsertById(profilePayload);
      setProfile(savedProfile);

      if (supabase) {
        const metadataPayload = {
          ...(user.user_metadata || {}),
          full_name: form.full_name,
          bio: form.bio,
          cidade: form.cidade,
          pais: form.pais,
          telefone: form.telefone,
          nome_empresa: form.nome_empresa,
          site_empresa: form.site_empresa,
          role: targetRole,
        };

        if (authSafePhoto) {
          metadataPayload.foto_perfil = authSafePhoto;
          metadataPayload.avatar_url = authSafePhoto;
        } else {
          delete metadataPayload.foto_perfil;
          delete metadataPayload.avatar_url;
        }

        supabase.auth.updateUser({
          data: metadataPayload,
        }).catch((authError) => console.warn('Auth metadata update skipped:', authError));
      }

      if (targetRole === 'freelancer') {
        await db.freelancerStats.upsert({
          user_email: user.email,
          profissao: statsForm.profissao,
          habilidades: statsForm.habilidades.split(',').map((skill) => skill.trim()).filter(Boolean),
          valor_hora: statsForm.valor_a_combinar ? 0 : Number(String(statsForm.valor_hora).replace(',', '.') || 0),
          valor_a_combinar: statsForm.valor_a_combinar,
        });
      }

      setSaved(true);
      checkUserAuth().catch((authError) => console.warn('Auth refresh after settings save failed:', authError));
    } catch (err) {
      console.error('Settings save error:', err);
      setError(err instanceof Error ? err.message : 'Não foi possível salvar as alterações.');
    } finally {
      setSaving(false);
    }
  };

  const avatarInitial = form.full_name?.[0] || user?.email?.[0] || 'U';
  const saveLabel = saving ? 'Salvando...' : saved ? 'Salvo!' : 'Salvar Alterações';

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="font-heading font-bold text-2xl text-foreground">Configurações</h1>
        <p className="text-sm text-muted-foreground mt-1">Gerencie seu perfil publico e preferencias</p>
      </div>

      {error && <div className="glass rounded-2xl p-4 text-sm text-destructive">{error}</div>}
      {saved && <div className="glass rounded-2xl p-4 text-sm text-green-400">Alterações salvas.</div>}

      <div className="glass rounded-2xl p-5">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center">
              {foto ? (
                <img src={foto} alt="Foto" className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl font-bold text-white">{avatarInitial.toUpperCase()}</span>
              )}
            </div>
            <button
              onClick={() => fileRef.current?.click()}
              className="absolute -bottom-1 -right-1 w-7 h-7 rounded-lg bg-primary flex items-center justify-center hover:bg-primary/80 transition-colors"
            >
              {uploading ? <Loader2 className="w-3.5 h-3.5 text-white animate-spin" /> : <Camera className="w-3.5 h-3.5 text-white" />}
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
          </div>
          <div className="min-w-0">
            <p className="font-heading font-semibold text-foreground truncate">{form.full_name || user?.email}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            <p className="text-xs text-primary mt-1 capitalize">{user?.role}</p>
          </div>
        </div>
      </div>

      <div className="glass rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <User className="w-4 h-4 text-primary" />
          <h2 className="font-heading font-semibold text-foreground">Perfil</h2>
        </div>
        <div className="space-y-4">
          <div>
            <Label className="text-xs text-muted-foreground">Nome publico</Label>
            <Input className="mt-1 bg-secondary/50 border-border/50 rounded-xl" value={form.full_name} onChange={(event) => setForm((prev) => ({ ...prev, full_name: event.target.value }))} />
          </div>

          {user?.role === 'client' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">Nome da empresa</Label>
                <Input className="mt-1 bg-secondary/50 border-border/50 rounded-xl" value={form.nome_empresa} onChange={(event) => setForm((prev) => ({ ...prev, nome_empresa: event.target.value }))} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Site da empresa</Label>
                <Input className="mt-1 bg-secondary/50 border-border/50 rounded-xl" value={form.site_empresa} onChange={(event) => setForm((prev) => ({ ...prev, site_empresa: event.target.value }))} />
              </div>
            </div>
          )}

          <div>
            <Label className="text-xs text-muted-foreground">Bio</Label>
            <Input className="mt-1 bg-secondary/50 border-border/50 rounded-xl" placeholder="Descreva-se brevemente..." value={form.bio} onChange={(event) => setForm((prev) => ({ ...prev, bio: event.target.value }))} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <Label className="text-xs text-muted-foreground">País</Label>
              <select
                className="mt-1 w-full h-10 bg-secondary/50 border border-border/50 rounded-xl px-3 text-sm text-foreground"
                value={form.pais}
                onChange={(event) => setForm((prev) => ({ ...prev, pais: event.target.value, cidade: '' }))}
                disabled={loadingCountries}
              >
                <option value="">{loadingCountries ? 'Escolha um país' : 'Selecione'}</option>
                {countries.map((country) => (
                  <option key={country.code} value={country.name}>{country.name}</option>
                ))}
              </select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Estado</Label>
              <select
                className="mt-1 w-full h-10 bg-secondary/50 border border-border/50 rounded-xl px-3 text-sm text-foreground"
                value={form.cidade}
                onChange={(event) => setForm((prev) => ({ ...prev, cidade: event.target.value }))}
                disabled={!form.pais || loadingCities}
              >
                <option value="">{loadingCities ? 'Escolha um estado' : 'Selecione'}</option>
                {cities.map((city) => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Telefone</Label>
              <Input className="mt-1 bg-secondary/50 border-border/50 rounded-xl" inputMode="tel" placeholder="(11) 99999-9999" value={form.telefone} onChange={(event) => setForm((prev) => ({ ...prev, telefone: formatPhone(event.target.value) }))} />
            </div>
          </div>

          {user?.role === 'freelancer' && (
            <>
              <div>
                <Label className="text-xs text-muted-foreground">Profissão</Label>
                <Input className="mt-1 bg-secondary/50 border-border/50 rounded-xl" placeholder="Ex: UI/UX Designer" value={statsForm.profissao} onChange={(event) => setStatsForm((prev) => ({ ...prev, profissao: event.target.value }))} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Habilidades</Label>
                <Input className="mt-1 bg-secondary/50 border-border/50 rounded-xl" placeholder="React, Figma, Node..." value={statsForm.habilidades} onChange={(event) => setStatsForm((prev) => ({ ...prev, habilidades: event.target.value }))} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Valor por hora</Label>
                  <Input className="mt-1 bg-secondary/50 border-border/50 rounded-xl" inputMode="decimal" placeholder="Ex: 80" value={statsForm.valor_hora} disabled={statsForm.valor_a_combinar} onChange={(event) => setStatsForm((prev) => ({ ...prev, valor_hora: event.target.value.replace(/[^\d,.]/g, '') }))} />
                </div>
                <label className="flex items-center gap-3 mt-6 text-sm text-foreground">
                  <input
                    type="checkbox"
                    checked={statsForm.valor_a_combinar}
                    onChange={(event) => setStatsForm((prev) => ({ ...prev, valor_a_combinar: event.target.checked }))}
                    className="h-4 w-4 accent-primary"
                  />
                  A combinar
                </label>
              </div>
            </>
          )}
        </div>
      </div>

      <Button
        onClick={handleSave}
        disabled={saving || uploading}
        translate="no"
        className="bg-gradient-to-r from-primary to-accent text-white border-0 rounded-xl px-8 gap-2"
      >
        {saving && <Loader2 className="w-4 h-4 animate-spin" />}
        {saved && !saving && <CheckCircle className="w-4 h-4" />}
        <span>{saveLabel}</span>
      </Button>
    </div>
  );
}
