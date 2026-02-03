import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Sparkles, Zap, Rocket } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Feature } from '../types';

export function DynamicFeaturePage() {
  const location = useLocation();
  const [feature, setFeature] = useState<Feature | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFeature();
  }, [location.pathname]);

  const loadFeature = async () => {
    try {
      const { data, error } = await supabase
        .from('features')
        .select('*')
        .eq('route', location.pathname)
        .maybeSingle();

      if (error) throw error;
      setFeature(data);
    } catch (error) {
      console.error('Error loading feature:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-slate-200 border-t-slate-600 rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-slate-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!feature) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-10 h-10 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Funcionalidade não encontrada</h2>
          <p className="text-slate-600">A rota solicitada não está configurada no sistema.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">{feature.menu_label}</h1>
        {feature.descricao && (
          <p className="text-slate-600">{feature.descricao}</p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
          <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mb-4">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Funcionalidade Ativa</h3>
          <p className="text-slate-600 text-sm">
            Esta página foi criada automaticamente e está pronta para receber conteúdo personalizado.
          </p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
          <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center mb-4">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Totalmente Dinâmica</h3>
          <p className="text-slate-600 text-sm">
            Novas funcionalidades aparecem automaticamente no menu lateral assim que são criadas.
          </p>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-6 border border-amber-200">
          <div className="w-12 h-12 bg-amber-600 rounded-lg flex items-center justify-center mb-4">
            <Rocket className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Pronta para Expandir</h3>
          <p className="text-slate-600 text-sm">
            Esta página pode ser customizada para atender às necessidades específicas do módulo.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
        <div className="text-center py-12">
          <div className="w-20 h-20 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
            <Sparkles className="w-10 h-10 text-slate-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-3">
            Bem-vindo à {feature.menu_label}
          </h2>
          <p className="text-slate-600 max-w-2xl mx-auto mb-6">
            Esta funcionalidade está ativa e integrada ao sistema de permissões.
            O conteúdo específico será desenvolvido conforme as necessidades do projeto.
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-lg text-sm text-slate-700">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            Rota: <code className="font-mono font-medium">{feature.route}</code>
          </div>
        </div>
      </div>
    </div>
  );
}
