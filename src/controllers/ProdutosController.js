const { Console } = require('console');
const connection = require('../database/connection');

module.exports = {   
        
    async index(request, response) {
        try {
            const produtos = await connection("suiProdutos")
            .select("*");
      
            return response.json(produtos);
        } catch (error) {
            console.error(error);
            return response.status(500).json({ message: "Erro ao listar Produtos" });
        }
    },
        
    async create(request, response) {
        const {prdDescricao, prdReferencia, prdUnidade, prdPrcUnitario, prdGrpId, prdLnhId, prdCnjId } = request.body;
        const status = "A";
        const [prdId] = await connection('suiProdutos').insert({
            prdDescricao, 
            prdReferencia, 
            prdUnidade, 
            prdPrcUnitario, 
            prdGrpId, 
            prdLnhId, 
            prdCnjId,
            prdStatus: status 
        });
           
        return response.json({prdId});
    }, 
    
    async searchProd(request, response) {
        const id = request.params.codigoProduto;
    
        //console.log('Produto:',id)
    
        const prod = await connection('suiProdutos')
        .where('prdId', id)
        .select('*')
        .first();
    
        return response.json(prod);
    },
};
