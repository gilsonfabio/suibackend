const express = require('express');
const routes = express.Router();

const UsersController = require('./controllers/UsersController');
const PagSeguroController = require('./controllers/PagSeguroController');
const CategoriasController = require('./controllers/CategoriasController');
const MovimentosController = require('./controllers/MovimentosController');
const SuitesController = require('./controllers/SuitesController');
const ProdutosController = require('./controllers/ProdutosController');

routes.get('/', (request, response) => {
    response.json({
        message: 'Bem-vindo ao servidor BackSuite!',
    });
});

routes.post('/signIn', UsersController.signIn);
routes.post('/newuser', UsersController.newuser);
routes.get('/searchUser/:cpf', UsersController.searchUser);
routes.get('/busUser/:idUsr', UsersController.busUser);
routes.post('/loginCpf', UsersController.loginCPF);

routes.get('/categorias', CategoriasController.index);

routes.post('/webhook/pagseguro', PagSeguroController.webhook);

routes.get('/movimentos', MovimentosController.index);
routes.post('/entrada', MovimentosController.entrada);
routes.post('/fechar', MovimentosController.fechar);
routes.get('/searchMovim/:suiId', MovimentosController.searchMovim);
routes.get('/dadosMovim/:movId', MovimentosController.dadosMovim);

routes.get('/searchSuite/:suiId', SuitesController.searchSuite);
routes.put('/limpezaSuite/:suiId', SuitesController.limpezaSuite);

routes.get('/searchItens/:movim', MovimentosController.searchItens);
routes.get('/searchProd/:codigoProduto', ProdutosController.searchProd);
routes.post('/newItem', MovimentosController.newItem);
routes.post('/removeItem', MovimentosController.removeItem);

module.exports = routes;
