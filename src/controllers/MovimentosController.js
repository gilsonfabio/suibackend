const { Console } = require('console');
const connection = require('../database/connection');
const moment = require('moment');

module.exports = {   
        
  async index(request, response) {
    const movimentos = await connection('movSuites')
    .select('*');
       
    return response.json(movimentos);
  }, 
        
  async entrada(request, response) {
    const id = request.body.suiId;
    const usr = request.body.usrId;
    const qtdExtra = request.body.qtdUsrExtra;

    const suite = await connection('suites')
    .where('suiId', id)
    .select('*')
    .first();

    const suiValor = suite.suiValor;
    const status = 'E';
 
    const datAtual = new Date();
    const day = String(datAtual.getDate()).padStart(2, '0');
    const month = String(datAtual.getMonth()).padStart(2, '0');
    const year = datAtual.getFullYear();
    const datProcess = new Date(year,month,day);

    const datEntrada = moment().format();

    const [movId] = await connection('movSuites').insert({
      movSuiId: id,
      movSuiData: datProcess,
      movSuiEntrada: datEntrada, 
      movSuiVlr: suiValor, 
      movSuiUsrEnt: usr, 
      movSuiUsrQtdExtra: qtdExtra, 
      movSuiStatus: status 
    });

    const staSuite = 'O';
    const updEntrada = await connection('suites')
    .where('suiId', id)
    .update({
        suiStatus: staSuite,
    });
         
    return response.json({movId});
  },  
  
  async fechar(request, response) {
    try {
      const id = request.body.movim;
  
      if (!id) {
        return response.status(400).json({ error: "ID do movimento não informado." });
      }
  
      console.log("Movimento recebido:", id);
  
      // Buscar movimento
      const mov = await connection("movSuites")
        .where("movId", id)
        .first();
  
      if (!mov) {
        return response.status(404).json({ error: "Movimento não encontrado." });
      }
  
      // Preparar dados de fechamento
      const agora = moment();
      const entrada = moment(mov.movSuiEntrada);
  
      const duracao = moment.duration(agora.diff(entrada));
  
      const horas = String(Math.floor(duracao.asHours())).padStart(2, "0");
      const minutos = String(duracao.minutes()).padStart(2, "0");
  
      const tempoPermanencia = `${horas}:${minutos}`;
  
      // Atualizar movimento
      await connection("movSuites")
        .where("movId", id)
        .update({
          movSuiSaida: agora.format("YYYY-MM-DD HH:mm:ss"),
          movSuiTmpPer: tempoPermanencia,
          movSuiStatus: "F",
        });
  
      // Liberar suíte
      await connection("suites")
        .where("suiId", mov.movSuiId)
        .update({ suiStatus: "L" });
  
      // Resposta final
      return response.json({
        sucesso: true,
        movId: id,
        tempo: tempoPermanencia,
      });
  
    } catch (error) {
      console.error("Erro ao fechar movimento:", error);
      return response.status(500).json({ error: "Erro ao fechar movimento." });
    }
  },  

  async searchMovim(request, response) {
    const id = request.params.suiId;
    const status = 'E';

    const movim = await connection('movSuites')
    .where('movSuiId', id)
    .where('movSuiStatus', status)
    .select('*')
    .first();

    return response.json(movim);
  },
  
  async dadosMovim(request, response) {
    const id = request.params.movId;
    const status = 'E';

    const movim = await connection('movSuites')
    .where('movId', id)
    .where('movSuiStatus', status)
    .select('*')
    .first();

    return response.json(movim);
  }, 

  async newItem(request, response) {
    const trx = await connection.transaction(); 

    try {
        const ped = request.body.movId;
        const prod = request.body.movConProId;
        const qtd = Number(request.body.movConProQtd);
        const vlr = Number(request.body.movConProVlrUnitario);

        if (!ped || !prod || !qtd || !vlr) {
            await trx.rollback();
            return response.status(400).json({ error: "Dados incompletos." });
        }

        const valorAcrescimo = qtd * vlr;

        const existingItem = await trx('movSuiItens')
            .where({ movSuiId: ped, movSuiProId: prod })
            .first();

        if (!existingItem) {
            await trx('movSuiItens').insert({
                movSuiId: ped,
                movSuiProId: prod,
                movSuiProQtd: qtd,
                movSuiProVUnit: vlr,
                movSuiProVTotal: valorAcrescimo,
                movSuiStatus: "A"
            });
        } else {
            const novaQtd = Number(existingItem.movSuiProQtd) + qtd;
            const novoTotalItem = Number(existingItem.movSuiProVUnit) * novaQtd;

            await trx('movSuiItens')
                .where({ movSuiId: ped, movSuiProId: prod })
                .update({
                    movSuiProQtd: novaQtd,
                    movSuiProVTotal: novoTotalItem
                });
        }

        const suite = await trx('movSuites').where({ movId: ped }).first();

        if (!suite) {
            console.error(`ERRO CRÍTICO: Não encontrei nenhuma suíte com movId = ${ped}`);
            await trx.rollback();
            return response.status(404).json({ error: "Suíte/Movimento não encontrado para atualizar o total." });
        }

        const consumoAtual = suite.movSuiTotConsumo ? Number(suite.movSuiTotConsumo) : 0.00;
        const novoConsumoTotal = consumoAtual + valorAcrescimo;

        const temporarioVTotal = suite.movSuiTotPagar ? Number(suite.movSuiTotPagar) : suite.movSuiVlr;
        const novoValorTotal = ((temporarioVTotal + novoConsumoTotal + suite.movSuiVlrAcrescimo + suite.movSuiUsrVlrExtra) - suite.movSuiVlrDesconto);

        const updateResult = await trx('movSuites')
            .where({ movId: ped })
            .update({ 
                movSuiTotConsumo: novoConsumoTotal,
                movSuiTotPagar: novoValorTotal 
            });

        await trx.commit(); 

        return response.json({
            success: true,
            message: "Processo concluído",
            novoTotalConsumo: novoConsumoTotal
        });

    } catch (error) {
        await trx.rollback();
        console.error("Erro no servidor:", error);
        return response.status(500).json({ error: "Erro interno." });
    }
  },
  
  async searchItens(request, response) {
    const id = request.params.movim;
    
    const movim = await connection('movSuiItens')
    .where('movSuiId', id)
    .join('suiProdutos', 'prdId', 'movSuiProId')
    .select(['movSuiItens.*', 'suiProdutos.prdDescricao', 'suiProdutos.prdReferencia', 'suiProdutos.prdUnidade']);
    
    return response.json(movim);
  }, 

  async removeItem(request, response) {
    const trx = await connection.transaction();

    try {
        const ped = request.body.movId;
        const prod = request.body.movConProId;
        const qtdRemover = Number(request.body.movConProQtd);

        if (!ped || !prod || !qtdRemover) {
            await trx.rollback();
            return response.status(400).json({ error: "Dados incompletos." });
        }

        // Buscar item existente
        const existingItem = await trx("movSuiItens")
            .where({ movSuiId: ped, movSuiProId: prod })
            .first();

        if (!existingItem) {
            await trx.rollback();
            return response.status(404).json({ error: "Item não encontrado no pedido." });
        }

        const qtdAtual = Number(existingItem.movSuiProQtd);
        const vlrUnit = Number(existingItem.movSuiProVUnit);

        // Se a quantidade a remover for maior do que existe → erro
        if (qtdRemover > qtdAtual) {
            await trx.rollback();
            return response.status(400).json({
                error: `Quantidade removida (${qtdRemover}) maior que a existente (${qtdAtual}).`
            });
        }

        // Valor total a remover
        const valorRemover = qtdRemover * vlrUnit;

        // Quantidade final após remoção
        const novaQtd = qtdAtual - qtdRemover;

        if (novaQtd === 0) {
            // Se quantidade ficou zero → remover o item por completo
            await trx("movSuiItens")
                .where({ movSuiId: ped, movSuiProId: prod })
                .del();
        } else {
            // Atualizar quantidade e total
            const novoTotalItem = novaQtd * vlrUnit;

            await trx("movSuiItens")
                .where({ movSuiId: ped, movSuiProId: prod })
                .update({
                    movSuiProQtd: novaQtd,
                    movSuiProVTotal: novoTotalItem
                });
        }

        // Buscar suíte/movimento
        const suite = await trx("movSuites")
            .where({ movId: ped })
            .first();

        if (!suite) {
            await trx.rollback();
            return response.status(404).json({ error: "Movimento não encontrado para atualizar totais." });
        }

        const consumoAtual = suite.movSuiTotConsumo ? Number(suite.movSuiTotConsumo) : 0;
        const novoConsumo = consumoAtual - valorRemover;

        // Nunca deixar negativo
        const consumoFinal = novoConsumo < 0 ? 0 : novoConsumo;

        // Recalcular total geral
        const totalBase = 
            suite.movSuiVlr +
            suite.movSuiVlrAcrescimo +
            suite.movSuiUsrVlrExtra -
            suite.movSuiVlrDesconto;

        const novoTotalGeral = totalBase + consumoFinal;

        // Atualizar totais
        await trx("movSuites")
            .where({ movId: ped })
            .update({
                movSuiTotConsumo: consumoFinal,
                movSuiTotPagar: novoTotalGeral,
            });

        await trx.commit();

        return response.json({
            success: true,
            message: "Item removido com sucesso.",
            novoTotalConsumo: consumoFinal,
            novoTotalGeral
        });

    } catch (error) {
        await trx.rollback();
        console.error("Erro no servidor:", error);
        return response.status(500).json({ error: "Erro interno no servidor." });
    }
  },
};
