const { Console } = require('console');
const connection = require('../database/connection');

module.exports = {   
        
  async index(request, response) {
    try {
      const suites = await connection("suites")
        .select("*")
        .orderBy("suiId");
          
      return response.json(suites);
    } catch (error) {
      console.error(error);
      return response.status(500).json({ message: "Erro ao listar" });
    }
  },
        
  async create(request, response) {
    const {suiDescricao} = request.body;
    const [suiId] = await connection('suites').insert({
        suiDescricao, 
    });
           
    return response.json({suiId});
  }, 
  
  async searchSuite(request, response) {
    try {
      const id = request.params.suiId;

      const suite = await connection("suites")
        .where("suiId", id)
        .select("*")
        .orderBy("suiId")
        .first();
          
      return response.json(suite);
    } catch (error) {
      console.error(error);
      return response.status(500).json({ message: "Erro ao listar" });
    }
  },
    
};
