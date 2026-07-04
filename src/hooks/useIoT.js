import { useState, useCallback, useEffect } from 'react';
import api from '../services/api';

export default function useIoT() {
  const [painelAtivoId, setPainelAtivoId] = useState(null);
  const [painelAtivoNome, setPainelAtivoNome] = useState(null);
  const [carregandoPainelId, setCarregandoPainelId] = useState(null);
  const [cancelandoPainel, setCancelandoPainel] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(false);

  // Busca o status atual do painel (se tem alguém na bancada)
  const fetchPainelStatus = useCallback(async () => {
    try {
      const response = await api.get('/api/iot/atendimento-ativo/status/', {
        params: { _t: new Date().getTime() }
      });
      if (response.data.ativo) {
        setPainelAtivoId(response.data.agendamento_id);
        setPainelAtivoNome(response.data.nome_cliente_exibicao);
      } else {
        setPainelAtivoId(null);
        setPainelAtivoNome(null);
      }
    } catch (error) {
      console.warn('Não foi possível consultar o estado do painel:', error.message);
    }
  }, []);

  // Faz polling se o painel estiver ativo (ou sempre que o hook estiver montado)
  useEffect(() => {
    // Checa a cada 5 segundos
    const interval = setInterval(() => {
      fetchPainelStatus();
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchPainelStatus]);

  // Envia um cliente para a bancada (Agendamento ou Walk-In manual)
  const ativarPainel = async (agendamentoId, clienteNome = null, valorTotalManual = null) => {
    if (carregandoPainelId !== null) return { success: false, error: 'Já carregando' };
    
    setCarregandoPainelId(agendamentoId || 'walkin');
    try {
      const payload = {};
      if (agendamentoId) payload.agendamento_id = agendamentoId;
      if (clienteNome) payload.nome_cliente = clienteNome;
      if (valorTotalManual !== null) payload.valor_total_manual = valorTotalManual;

      const response = await api.post('/api/iot/atendimento-ativo/', payload);
      setPainelAtivoId(agendamentoId);
      setPainelAtivoNome(clienteNome || response.data.nome_cliente_exibicao);
      return { success: true, message: response.data.mensagem };
    } catch (error) {
      const msg = error.response?.data?.error || error.message;
      return { success: false, error: msg };
    } finally {
      setCarregandoPainelId(null);
    }
  };

  // Cancela o atendimento na bancada
  const cancelarPainel = async () => {
    if (cancelandoPainel) return { success: false, error: 'Já cancelando' };
    setCancelandoPainel(true);
    try {
      await api.delete('/api/iot/atendimento-ativo/cancelar/');
      setPainelAtivoId(null);
      setPainelAtivoNome(null);
      return { success: true };
    } catch (error) {
      const msg = error.response?.data?.error || error.message;
      return { success: false, error: msg };
    } finally {
      setCancelandoPainel(false);
    }
  };

  return {
    painelAtivoId,
    painelAtivoNome,
    carregandoPainelId,
    cancelandoPainel,
    loadingStatus,
    fetchPainelStatus,
    ativarPainel,
    cancelarPainel
  };
}
