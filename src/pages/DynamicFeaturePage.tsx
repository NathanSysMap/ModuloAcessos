import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { FileQuestion } from 'lucide-react';
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
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-slate-200 border-t-slate-600 rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-slate-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!feature) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <FileQuestion className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-700 mb-2">Funcionalidade não encontrada</h2>
          <p className="text-slate-500">A rota solicitada não está configurada no sistema.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">{feature.menu_label}</h1>
        {feature.descricao && (
          <p className="text-slate-600">{feature.descricao}</p>
        )}
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-8">
        <div className="text-center py-12">
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <FileQuestion className="w-10 h-10 text-slate-400" />
          </div>
          <h2 className="text-xl font-semibold text-slate-700 mb-2">
            Página em construção
          </h2>
          <p className="text-slate-500 max-w-md mx-auto">
            Esta funcionalidade foi criada mas ainda não possui uma interface customizada.
            O conteúdo específico será desenvolvido em breve.
          </p>
        </div>
      </div>
    </div>
  );
}
