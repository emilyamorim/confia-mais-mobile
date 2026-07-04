import { useState, useCallback } from 'react';
import api from '../services/api';

export default function useAgendamentos() {
  const [agendamentos, setAgendamentos] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchAgendamentos = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/agendamentos/');
      setAgendamentos(response.data);
    } catch (error) {
      console.warn("Rota /api/agendamentos/ não retornou os dados. Erro: " + error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const atualizarStatus = async (id, novoStatus) => {
    try {
      await api.patch(`/api/agendamentos/${id}/`, { status: novoStatus });
      await fetchAgendamentos();
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Não foi possível atualizar o status do agendamento.' };
    }
  };

  return {
    agendamentos,
    loading,
    fetchAgendamentos,
    atualizarStatus
  };
}
