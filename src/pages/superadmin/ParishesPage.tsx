import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { 
  Plus, 
  Building2, 
  UserPlus, 
  AlertCircle, 
  Loader2, 
  MapPin, 
  Cross,
  Hash,
  Pencil,
  PowerOff,
  Power,
  Wand2
} from 'lucide-react'
import type { Tables } from '../../types/database'

type Parish = Tables<'parishes'>

export const ParishesPage = () => {
  const [parishes, setParishes] = useState<Parish[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showParishModal, setShowParishModal] = useState(false)
  const [showAdminModal, setShowAdminModal] = useState(false)
  const [selectedParish, setSelectedParish] = useState<Parish | null>(null)
  const [editingParish, setEditingParish] = useState<Parish | null>(null)
  
  const [formData, setFormData] = useState({
    name: '',
    cnpj: '',
    city: '',
    state: '',
    diocese: '',
    address: '',
    phone: ''
  })
  
  // States for parish admin
  const [adminName, setAdminName] = useState('')
  const [adminEmail, setAdminEmail] = useState('')

  useEffect(() => {
    fetchParishes()
  }, [])

  const fetchParishes = async () => {
    try {
      const { data, error } = await supabase
        .from('parishes')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setParishes(data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenParishModal = (parish?: Parish) => {
    if (parish) {
      setEditingParish(parish)
      setFormData({
        name: parish.name,
        cnpj: parish.cnpj || '',
        city: parish.city || '',
        state: parish.state || '',
        diocese: parish.diocese || '',
        address: parish.address || '',
        phone: parish.phone || ''
      })
    } else {
      setEditingParish(null)
      setFormData({
        name: '',
        cnpj: '',
        city: '',
        state: '',
        diocese: '',
        address: '',
        phone: ''
      })
    }
    setShowParishModal(true)
  }

  const fillPrescribedData = () => {
    setFormData({
      name: 'Paróquia Santa Rita de Cássia',
      cnpj: '12.345.678/0001-99',
      city: 'Campinas',
      state: 'SP',
      diocese: 'Arquidiocese de Campinas',
      address: 'Av. das Rosas, 123 - Nova Campinas',
      phone: '(19) 3232-0000'
    })
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSaveParish = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      if (editingParish) {
        const { error } = await supabase.from('parishes').update({
          name: formData.name,
          cnpj: formData.cnpj,
          city: formData.city,
          state: formData.state,
          diocese: formData.diocese,
          address: formData.address,
          phone: formData.phone
        }).eq('id', editingParish.id)

        if (error) throw error
      } else {
        const { error } = await supabase.from('parishes').insert({
          name: formData.name,
          cnpj: formData.cnpj,
          city: formData.city,
          state: formData.state,
          diocese: formData.diocese,
          address: formData.address,
          phone: formData.phone,
          status: 'active'
        })

        if (error) throw error
      }
      
      setShowParishModal(false)
      fetchParishes()
    } catch (err) {
      alert('Erro ao salvar paróquia. Verifique os dados.')
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  const toggleStatus = async (parish: Parish) => {
    const action = parish.status === 'active' ? 'desativar' : 'ativar'
    if (!window.confirm(`Tem certeza que deseja ${action} a paróquia "${parish.name}"?\nA paróquia não será excluída para manter os dados seguros.`)) return
    
    setLoading(true)
    try {
      const newStatus = parish.status === 'active' ? 'suspended' : 'active'
      const { error } = await supabase.from('parishes').update({ status: newStatus }).eq('id', parish.id)
      if (error) throw error
      await fetchParishes()
    } catch(err) {
      alert('Erro ao atualizar status.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedParish) return
    setSubmitting(true)

    try {
      const { error } = await supabase.auth.signUp({
        email: adminEmail,
        password: 'password123', // Default password
        options: {
          data: {
            full_name: adminName,
            role: 'admin',
            parish_id: selectedParish.id
          }
        }
      })

      if (error) throw error

      alert(`Acesso criado! Admin: ${adminEmail}\nSenha padrão: password123`)
      setShowAdminModal(false)
      setAdminName('')
      setAdminEmail('')
    } catch (err) {
      alert('Erro ao criar acesso administrativo.')
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <div className="space-y-8 animate-fade-in">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-black text-lumen-navy">Paróquias</h2>
            <p className="text-slate-500 font-medium">Gerencie as instituições, edite dados e configure acessos</p>
          </div>
          <button 
            onClick={() => handleOpenParishModal()}
            className="bg-lumen-navy hover:bg-lumen-blue text-white px-6 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-lumen-navy/10 active:scale-95 whitespace-nowrap"
          >
            <Plus className="w-5 h-5" />
            Nova Paróquia
          </button>
        </header>

        {loading && parishes.length === 0 ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-lumen-navy" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {parishes.map((parish) => (
              <div key={parish.id} className={`bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all group relative overflow-hidden flex flex-col ${parish.status === 'suspended' ? 'opacity-75 grayscale-[0.2]' : ''}`}>
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Building2 className="w-20 h-20 text-lumen-navy" />
                </div>
                
                <div className="flex items-start justify-between mb-4 relative z-10">
                  <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                    parish.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {parish.status === 'active' ? 'Ativa' : 'Suspensa'}
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => handleOpenParishModal(parish)} 
                      className="p-2 text-slate-300 hover:text-lumen-blue hover:bg-lumen-blue/10 rounded-xl transition-all"
                      title="Editar Paróquia"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => toggleStatus(parish)} 
                      className={`p-2 rounded-xl transition-all ${
                        parish.status === 'active' 
                          ? 'text-slate-300 hover:text-rose-500 hover:bg-rose-500/10' 
                          : 'text-slate-300 hover:text-emerald-500 hover:bg-emerald-500/10'
                      }`}
                      title={parish.status === 'active' ? 'Desativar (não exclui dados)' : 'Reativar Paróquia'}
                    >
                      {parish.status === 'active' ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <h3 className="text-xl font-black text-lumen-navy mb-2 line-clamp-1 relative z-10" title={parish.name}>{parish.name}</h3>
                
                <div className="space-y-3 mb-6 flex-1 relative z-10">
                  <div className="flex items-center gap-2 text-slate-500 text-sm font-medium">
                    <Hash className="w-4 h-4 text-lumen-teal/50" />
                    <span className="truncate">CNPJ: {parish.cnpj || 'Não informado'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-500 text-sm font-medium">
                    <MapPin className="w-4 h-4 text-lumen-teal/50" />
                    <span className="truncate">{parish.city}, {parish.state}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-500 text-sm font-medium">
                    <Cross className="w-4 h-4 text-lumen-gold/50" />
                    <span className="truncate">Diocese: {parish.diocese || 'Não informada'}</span>
                  </div>
                </div>

                {parish.status === 'active' && (
                  <button 
                    onClick={() => {
                      setSelectedParish(parish)
                      setShowAdminModal(true)
                    }}
                    className="w-full bg-slate-50 hover:bg-lumen-navy hover:text-white text-lumen-navy py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 text-sm relative z-10"
                  >
                    <UserPlus className="w-4 h-4" />
                    Configurar Acesso
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Paróquia (Create/Edit) */}
      {showParishModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto custom-scrollbar animate-in fade-in duration-200">
          <div className="fixed inset-0 bg-lumen-navy/40 backdrop-blur-sm" onClick={() => setShowParishModal(false)}></div>
          
          <div className="flex min-h-screen items-center justify-center p-4 sm:p-6">
            <div className="relative bg-white w-full max-w-2xl rounded-[40px] p-6 sm:p-10 shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-black text-lumen-navy">
                  {editingParish ? 'Editar Paróquia' : 'Cadastrar Nova Paróquia'}
                </h3>
                
                {!editingParish && (
                  <button 
                    type="button"
                    onClick={fillPrescribedData}
                    className="flex items-center gap-2 text-xs font-bold text-lumen-blue bg-lumen-blue/10 hover:bg-lumen-blue/20 px-3 py-2 rounded-xl transition-colors"
                  >
                    <Wand2 className="w-3 h-3" />
                    Autopreencher Teste
                  </button>
                )}
              </div>

              <form onSubmit={handleSaveParish} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">Nome da Paróquia</label>
                    <input 
                      required
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full bg-slate-50 border-0 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-lumen-teal transition-all"
                      placeholder="Ex: Paróquia Santo Antônio" 
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">CNPJ</label>
                    <input 
                      required
                      name="cnpj"
                      value={formData.cnpj}
                      onChange={handleChange}
                      className="w-full bg-slate-50 border-0 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-lumen-teal transition-all"
                      placeholder="00.000.000/0000-00" 
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">Telefone</label>
                    <input 
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full bg-slate-50 border-0 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-lumen-teal transition-all"
                      placeholder="(00) 00000-0000" 
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">Diocese</label>
                    <input 
                      name="diocese"
                      value={formData.diocese}
                      onChange={handleChange}
                      className="w-full bg-slate-50 border-0 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-lumen-teal transition-all"
                      placeholder="Ex: Diocese de Jundiaí" 
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">Cidade</label>
                    <input 
                      required
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      className="w-full bg-slate-50 border-0 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-lumen-teal transition-all"
                      placeholder="Cidade" 
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">Estado</label>
                    <input 
                      required
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      className="w-full bg-slate-50 border-0 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-lumen-teal transition-all"
                      placeholder="UF" 
                      maxLength={2}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">Endereço Completo</label>
                    <input 
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      className="w-full bg-slate-50 border-0 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-lumen-teal transition-all"
                      placeholder="Rua, Número, Bairro" 
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    type="button"
                    onClick={() => setShowParishModal(false)}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-4 rounded-2xl transition-all"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-lumen-navy hover:bg-lumen-blue text-white font-bold py-4 rounded-2xl transition-all shadow-xl shadow-lumen-navy/20 flex items-center justify-center gap-2"
                  >
                    {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (editingParish ? 'Salvar Alterações' : 'Confirmar Cadastro')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal Admin */}
      {showAdminModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto custom-scrollbar animate-in fade-in duration-200">
          <div className="fixed inset-0 bg-lumen-navy/40 backdrop-blur-sm" onClick={() => setShowAdminModal(false)}></div>
          
          <div className="flex min-h-screen items-center justify-center p-4 sm:p-6">
            <div className="relative bg-white w-full max-w-md rounded-[40px] p-6 sm:p-10 shadow-2xl animate-in zoom-in-95 duration-200">
              <h3 className="text-2xl font-black text-lumen-navy mb-2">Novo Administrador</h3>
              <p className="text-slate-500 text-sm mb-8 font-medium">Configurar acesso para: <span className="text-lumen-blue font-bold">{selectedParish?.name}</span></p>
              
              <form onSubmit={handleCreateAdmin} className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">Nome Completo</label>
                  <input 
                    required
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    className="w-full bg-slate-50 border-0 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-lumen-teal transition-all"
                    placeholder="Nome do responsável" 
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">Email de Acesso</label>
                  <input 
                    required
                    type="email"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    className="w-full bg-slate-50 border-0 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-lumen-teal transition-all"
                    placeholder="email@paroquia.com" 
                  />
                </div>

                <div className="bg-amber-50 rounded-2xl p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-amber-700 font-bold leading-relaxed">
                    A senha padrão temporária será <code className="bg-amber-100 px-1 rounded">password123</code>. O administrador deverá alterá-la no primeiro acesso.
                  </p>
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    type="button"
                    onClick={() => setShowAdminModal(false)}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-4 rounded-2xl transition-all"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-lumen-navy hover:bg-lumen-blue text-white font-bold py-4 rounded-2xl transition-all shadow-xl shadow-lumen-navy/20 flex items-center justify-center gap-2"
                  >
                    {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Criar Acesso'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
