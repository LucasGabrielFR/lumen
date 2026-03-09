import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Mail, Lock, Loader2, Sparkles } from 'lucide-react'

export const LoginPage = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { data, error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (loginError) {
      setError(loginError.message)
      setLoading(false)
      return
    }

    // Check profile role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single()

    if (profile?.role === 'superadmin') {
      navigate('/admin')
    } else if (profile?.role === 'admin' || profile?.role === 'user') {
      navigate('/parish')
    } else {
      navigate('/')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-lumen-light-gold/30 via-slate-50 to-white">
      <div className="w-full max-w-md bg-white rounded-[40px] shadow-2xl p-10 border border-white relative overflow-hidden">
        <div className="absolute top-0 right-0 p-10 opacity-10 blur-2xl text-lumen-blue scale-150 transform rotate-12">
          <Sparkles className="w-32 h-32" />
        </div>
        
        <header className="text-center mb-10 relative">
          <div className="w-56 h-56 mx-auto -mb-6 relative">
            <img src="/lumen-sem-back.png" alt="Lumen Logo" className="w-full h-full object-contain focus-visible:outline-none" />
          </div>
          <p className="text-lumen-blue/60 font-medium tracking-tight mt-4">Gestão Paroquial e Comunicação Inteligente</p>
        </header>

        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-600 text-sm font-bold flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
            <div className="w-2 h-2 bg-rose-500 rounded-full animate-pulse" />
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6 relative">
          <div>
            <label className="block text-sm font-bold text-lumen-navy mb-2 ml-1">Email</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-lumen-accent transition-colors">
                <Mail className="w-5 h-5" />
              </div>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-50 border-0 rounded-2xl pl-12 pr-5 py-4 focus:ring-2 focus:ring-lumen-teal focus:bg-white transition-all text-lumen-navy font-medium placeholder:text-slate-300"
                placeholder="exemplo@lumen.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-lumen-navy mb-2 ml-1">Senha</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-lumen-accent transition-colors">
                <Lock className="w-5 h-5" />
              </div>
              <input
                required
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50 border-0 rounded-2xl pl-12 pr-5 py-4 focus:ring-2 focus:ring-lumen-teal focus:bg-white transition-all text-lumen-navy font-medium placeholder:text-slate-300"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-lumen-navy hover:bg-lumen-blue text-white font-black py-5 rounded-2xl transition-all shadow-xl shadow-lumen-navy/20 flex items-center justify-center gap-3 disabled:opacity-50 active:scale-95"
          >
            {loading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <>
                <span>Entrar no Sistema</span>
                <Sparkles className="w-5 h-5 text-lumen-gold" />
              </>
            )}
          </button>
        </form>

        <footer className="mt-10 text-center text-slate-400 text-sm font-medium">
          Esqueceu sua senha? <button className="text-lumen-teal font-bold hover:underline">Recuperar acesso</button>
        </footer>
      </div>
    </div>
  )
}
