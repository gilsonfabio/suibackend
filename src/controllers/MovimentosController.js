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

      const movim = await connection('movSuites')
        .where('movId', id)
        .select('*')
        .first();

      if (!movim) {
        return response.status(404).json({ error: 'Movimento não encontrado.' });
      }

      const status = 'F';
      const datSaida = moment();
      const datEntrada = moment(movim.movSuiEntrada);

      const diffMs = datSaida.diff(datEntrada);
      const duracao = moment.duration(diffMs);

      const horas = Math.floor(duracao.asHours());
      const minutos = duracao.minutes();

      const tempoFormatado = `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}`;

      await connection('movSuites')
        .where('movId', id)
        .update({
          movSuiSaida: datSaida.format('YYYY-MM-DD HH:mm:ss'),
          movSuiTmpPer: tempoFormatado,
          movSuiStatus: status,
        });

      await connection('suites')
        .where('suiId', movim.movSuiId)
        .update({ suiStatus: 'L' });

      return response.json({
        sucesso: true,
        movId: id,
        tempo: tempoFormatado,
      });
    } catch (error) {
      console.error(error);
      return response.status(500).json({ error: 'Erro ao fechar movimento.' });
    }
  },

  async searchMovim(request, response) {
    const id = request.params.suiId;
    const status = 'E';

    console.log('Suite:',id)

    const movim = await connection('movSuites')
    .where('movSuiId', id)
    .where('movSuiStatus', status)
    .select('*')
    .first();

    console.log(movim)

    return response.json(movim);
  },
  
  async dadosMovim(request, response) {
    const id = request.params.movId;
    const status = 'E';

    console.log('Suite:',id)

    const movim = await connection('movSuites')
    .where('movId', id)
    .where('movSuiStatus', status)
    .select('*')
    .first();

    console.log(movim)

    return response.json(movim);
  }, 

};


/*
    movSuiVlrPer, 
      movSuiTotConsumo, 
      movSuiVlrAcrescimo, 
      movSuiVlrDesconto, 
      movSuiTotPagar, 
      movSuiUsrEnt, 
      movSuiUsrSai, 
      movSuiUsrQtdExtra, 
      movSuiUsrVlrExtra, 
      movSuiPrmId, 
      movSuiPrmValor,
*/