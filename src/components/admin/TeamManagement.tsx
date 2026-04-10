import { useState, useEffect, useCallback, type CSSProperties } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';

const T = {
  bg: '#F8F9FC', card: '#FFFFFF', border: '#E8ECF4', text: '#1A1D26',
  muted: '#8892A4', blue: '#3B82F6', purple: '#8B5CF6', green: '#10B981',
  amber: '#F59E0B', red: '#EF4444',
};

interface TeamMember { id: string; name: string; email: string; role: string; is_active: boolean; invited_at: string; joined_at: string | null; }
interface ActivityLog { id: string; user_name: string; action: string; details: string | null; created_at: string; }

const roleLabels: Record<string, { label: string; color: string }> = {
  admin: { label: 'Admin', color: T.purple },
  manager: { label: 'Gerente', color: T.blue },
  operator: { label: 'Operador', color: T.green },
  viewer: { label: 'Visualizador', color: T.muted },
};

const TeamManagement = ({ tenantId }: { tenantId: string | null }) => {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<TeamMember | null>(null);
  const [form, setForm] = useState({ name: '', email: '', role: 'operator' });

  const fetchMembers = useCallback(async () => {
    if (!tenantId) return;
    const { data } = await supabase.from('team_members').select('*').eq('tenant_id', tenantId).order('created_at');
    setMembers((data || []) as TeamMember[]);
  }, [tenantId]);

  const fetchLogs = useCallback(async () => {
    if (!tenantId) return;
    const { data } = await supabase.from('activity_logs').select('*').eq('tenant_id', tenantId).order('created_at', { ascending: false }).limit(20);
    setLogs((data || []) as ActivityLog[]);
  }, [tenantId]);

  useEffect(() => { fetchMembers(); fetchLogs(); }, [fetchMembers, fetchLogs]);

  const openCreate = () => { setEditing(null); setForm({ name: '', email: '', role: 'operator' }); setDialogOpen(true); };
  const openEdit = (m: TeamMember) => { setEditing(m); setForm({ name: m.name, email: m.email, role: m.role }); setDialogOpen(true); };

  const handleSave = async () => {
    if (!tenantId || !form.name.trim() || !form.email.trim()) { toast({ title: 'Preencha nome e email', variant: 'destructive' }); return; }
    const payload = { tenant_id: tenantId, name: form.name.trim(), email: form.email.trim(), role: form.role };
    if (editing) {
      await supabase.from('team_members').update(payload).eq('id', editing.id);
      toast({ title: 'Membro atualizado!' });
    } else {
      await supabase.from('team_members').insert({ ...payload, is_active: true });
      toast({ title: 'Membro convidado!' });
    }
    setDialogOpen(false); fetchMembers();
  };

  const handleRemove = async (id: string) => { await supabase.from('team_members').delete().eq('id', id); toast({ title: 'Membro removido!' }); fetchMembers(); };
  const toggleActive = async (m: TeamMember) => { await supabase.from('team_members').update({ is_active: !m.is_active }).eq('id', m.id); fetchMembers(); };

  const formatDate = (d: string) => { const dt = new Date(d); return `${dt.toLocaleDateString('pt-BR')} ${dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`; };

  const inputStyle: CSSProperties = { width: '100%', padding: '10px 14px', fontSize: '0.9rem', color: T.text, background: T.bg, border: `1px solid ${T.border}`, borderRadius: 10, outline: 'none', fontFamily: 'inherit' };
  const labelStyle: CSSProperties = { fontSize: '0.78rem', fontWeight: 600, color: T.text, marginBottom: 6, display: 'block' };
  const btnPrimary: CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 8, padding: '9px 20px', borderRadius: 10, background: `linear-gradient(135deg, ${T.blue}, ${T.purple})`, color: '#fff', fontWeight: 600, fontSize: 13, border: 'none', cursor: 'pointer' };
  const btnIcon: CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, borderRadius: 8, border: `1px solid ${T.border}`, background: T.card, cursor: 'pointer', transition: 'all 0.2s' };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: '1rem', fontWeight: 700, color: T.text }}>Equipe</div>
          <div style={{ fontSize: '0.78rem', color: T.muted }}>{members.length} membros</div>
        </div>
        <button style={btnPrimary} onClick={openCreate}>+ Convidar</button>
      </div>

      {/* Members List */}
      {members.length === 0 ? (
        <p style={{ fontSize: 13, color: T.muted, textAlign: 'center', padding: '24px 0' }}>Nenhum membro na equipe</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
          {members.map(m => {
            const r = roleLabels[m.role] || roleLabels.viewer;
            return (
              <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 10, background: T.bg, border: `1px solid ${T.border}` }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: r.color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: r.color }}>
                  {m.name.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: m.is_active ? T.text : T.muted }}>{m.name}</div>
                  <div style={{ fontSize: 12, color: T.muted }}>{m.email}</div>
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 6, background: r.color + '15', color: r.color }}>{r.label}</span>
                {!m.is_active && <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 6, background: T.red + '15', color: T.red }}>Inativo</span>}
                <div style={{ display: 'flex', gap: 4 }}>
                  <button style={btnIcon} onClick={() => openEdit(m)} title="Editar">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={T.blue} strokeWidth="2"><path d="M17 3a2.85 2.83 0 114 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
                  </button>
                  <button style={btnIcon} onClick={() => toggleActive(m)} title={m.is_active ? 'Desativar' : 'Ativar'}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={m.is_active ? T.amber : T.green} strokeWidth="2"><circle cx="12" cy="12" r="10"/>{m.is_active ? <><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></> : <polyline points="20 6 9 17 4 12"/>}</svg>
                  </button>
                  <button style={btnIcon} onClick={() => handleRemove(m.id)} title="Remover">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={T.red} strokeWidth="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/></svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Activity Log */}
      <div style={{ marginTop: 8 }}>
        <div style={{ fontSize: '0.88rem', fontWeight: 700, color: T.text, marginBottom: 12 }}>Atividade Recente</div>
        {logs.length === 0 ? (
          <p style={{ fontSize: 13, color: T.muted, textAlign: 'center', padding: '16px 0' }}>Nenhuma atividade registrada</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {logs.map(l => (
              <div key={l.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 8, fontSize: 13 }}>
                <span style={{ fontSize: 11, color: T.muted, whiteSpace: 'nowrap', minWidth: 110 }}>{formatDate(l.created_at)}</span>
                <span style={{ fontWeight: 600, color: T.text }}>{l.user_name}</span>
                <span style={{ color: T.muted }}>{l.action}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'Editar Membro' : 'Convidar Membro'}</DialogTitle></DialogHeader>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div><label style={labelStyle}>Nome *</label><input style={inputStyle} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Nome completo" /></div>
            <div><label style={labelStyle}>Email *</label><input style={inputStyle} type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="email@exemplo.com" /></div>
            <div>
              <label style={labelStyle}>Funcao</label>
              <select style={inputStyle} value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                <option value="admin">Admin - Acesso total</option>
                <option value="manager">Gerente - Tudo exceto configuracoes</option>
                <option value="operator">Operador - Pedidos, entregas, produtos</option>
                <option value="viewer">Visualizador - Apenas visualizacao</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
            <button onClick={() => setDialogOpen(false)} style={{ padding: '9px 16px', borderRadius: 10, background: T.card, border: `1px solid ${T.border}`, cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>Cancelar</button>
            <button onClick={handleSave} style={btnPrimary}>Salvar</button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TeamManagement;
