const { Console } = require('console');
const connection = require('../database/connection');

module.exports = {   
        
  async index(request, response) {
    try {
      const categorias = await connection("catsuites")
        .select("catId", "catDescricao")
        .orderBy("catId");
  
      const suites = await connection("suites")
        .select("suiId", "suiDescricao", "suiCatId as catId", "suiStatus");
  
      const categoriasComSuites = categorias.map((cat) => ({
        ...cat,
        suites: suites.filter((sui) => sui.catId === cat.catId), 
      }));
  
      return response.json(categoriasComSuites);
    } catch (error) {
      console.error(error);
      return response.status(500).json({ message: "Erro ao listar" });
    }
  },
        
    async create(request, response) {
        const {catDescricao} = request.body;
        const [catId] = await connection('catsuites').insert({
            catDescricao, 
        });
           
        return response.json({grpId});
    }, 
    
    
};
