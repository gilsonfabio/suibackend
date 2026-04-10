const { Console } = require('console');
const connection = require('../database/connection');
import moment from 'moment';

module.exports = {   
        
  async index(request, response) {
    try {
      const kitchen = await connection("suiKitchen")
        .select("*")
        .orderBy("kitId");
          
      return response.json(kitchen);
    } catch (error) {
      console.error(error);
      return response.status(500).json({ message: "Erro ao listar" });
    }
  },
        
  async create(request, response) {
    const {
        kitSuiId,
        kitPrdId,
        kitPrdQtd,
        kitUsrId,
    } = request.body;

    const now = moment();
    const kitData = now.format('YYYY-MM-DD');
    const kitHora = now.format('HH:mm:ss');
    
    const KitStatus = 'P';

    const [kitId] = await connection('suiKitchen').insert({
        kitData,
        kitHora,
        kitSuiId,
        kitPrdId,
        kitPrdQtd,
        kitUsrId,        
        KitStatus
    });

    return response.json({ kitId });
  },
  
  async searchKitchen(request, response) {
    try {
      const id = request.params.kitId;

      const kitchen = await connection("suiKitchen")
        .where("kitId", id)
        .leftJoin('suiProdutos', 'prdId','suiKitchen.kitPrdId')
        .leftJoin('usuarios', 'usrId','suiKitchen.kitUsrId')
        .select(["suiKitchen.*", 'suiProdutos.prdDescricao', 'suiProdutos.prdReferencia', 'usuarios.usrNome'])
        .orderBy("kitId")
        .first();
          
      return response.json(kitchen);
    } catch (error) {
      console.error(error);
      return response.status(500).json({ message: "Erro ao listar" });
    }
  },
    
};
