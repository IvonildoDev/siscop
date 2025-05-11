from flask import Flask, Blueprint, request, jsonify
from flask_cors import CORS
from datetime import datetime, timedelta
import jwt
from database import db, Base, engine, get_db
import models
from routes import routes

# Chave secreta para JWT (em produção, use uma variável de ambiente)
SECRET_KEY = "sua-chave-secreta-aqui"

# Inicializar a aplicação Flask
app = Flask(__name__)
# Habilitar CORS para todas as rotas
CORS(app)

# Criar as tabelas no banco de dados
Base.metadata.create_all(bind=engine)

# Registrar o blueprint de rotas
app.register_blueprint(routes)

# Middleware para validar JWT
def token_required(f):
    def decorator(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'mensagem': 'Token é necessário!'}), 401
        try:
            # Se o token vier com "Bearer ", remover essa parte
            if token.startswith('Bearer '):
                token = token.replace('Bearer ', '')
                
            # Decodificar o token
            data = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
            
            # Adicionar informações do usuário no objeto request
            request.user = data
        except jwt.ExpiredSignatureError:
            return jsonify({'mensagem': 'Token expirado!'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'mensagem': 'Token inválido!'}), 401
        except Exception as e:
            return jsonify({'mensagem': f'Erro na autenticação: {str(e)}'}), 401
            
        return f(*args, **kwargs)
    decorator.__name__ = f.__name__
    return decorator

# Rota de teste para verificar se a API está funcionando
@app.route('/')
def index():
    return jsonify({
        'message': 'API do Sistema de Controle de Operações está funcionando!',
        'endpoints': [
            '/status',
            '/deslocamentos',
            '/deslocamentos/<id>',
            '/operacoes',
            '/deslocamentos/<id>/operacoes',
            '/login'
        ]
    })

# Rota para obter o status da aplicação
@app.route('/status')
def status():
    return jsonify({
        'status': 'online',
        'version': '1.0.0',
        'database': 'SQLite (op.db)',
        'timestamp': datetime.utcnow().isoformat()  # Corrigido para timestamp válido
    })

# Rota para login
@app.route('/login', methods=['POST'])
def login():
    data = request.json
    matricula = data.get('matricula')
    senha = data.get('senha')
    
    # Validar usuário e senha
    if not matricula or not senha:
        return jsonify({'mensagem': 'Matrícula e senha são obrigatórios!'}), 400
    
    # Usar sessão do banco de dados
    db_session = next(get_db())
    
    # Buscar usuário no banco de dados
    usuario = db_session.query(models.Usuario).filter_by(matricula=matricula).first()
    
    # Se usuário não existir ou senha estiver incorreta
    if not usuario or usuario.senha != senha:  # Em produção, use uma verificação segura de senha
        return jsonify({'mensagem': 'Matrícula ou senha incorretos!'}), 401
    
    # Se autenticação bem sucedida, gerar token JWT
    token = jwt.encode(
        {
            'sub': str(usuario.id),
            'nome': usuario.nome,
            'matricula': usuario.matricula,
            'exp': datetime.utcnow() + timedelta(hours=24)
        },
        SECRET_KEY,
        algorithm='HS256'
    )
    
    # Dados a retornar para o cliente
    return jsonify({
        'token': token,
        'id': usuario.id,
        'nome': usuario.nome,
        'matricula': usuario.matricula,
        'auxiliar': usuario.auxiliar if hasattr(usuario, 'auxiliar') else ''
    })

# Rota para obter e criar deslocamentos
@app.route('/deslocamentos', methods=['GET', 'POST'])
@token_required
def handle_deslocamentos():
    db_session = next(get_db())
    
    if request.method == 'GET':
        deslocamentos = db_session.query(models.Deslocamento).all()
        return jsonify([{
            'id': d.id,
            'origem': d.origem,
            'destino': d.destino,
            'km_inicial': d.km_inicial,
            'km_final': d.km_final,
            'distancia_percorrida': d.distancia_percorrida,
            'data_inicio': d.data_inicio.isoformat(),
            'data_fim': d.data_fim.isoformat() if d.data_fim else None
        } for d in deslocamentos])
    
    if request.method == 'POST':
        dados = request.get_json()
        
        # Validação dos dados
        required_fields = ['origem', 'destino', 'km_inicial']
        if not all(field in dados for field in required_fields):
            return jsonify({'mensagem': 'Campos obrigatórios ausentes!'}), 400
        
        if not isinstance(dados['km_inicial'], (int, float)) or dados['km_inicial'] < 0:
            return jsonify({'mensagem': 'KM inicial inválido!'}), 400
        
        if dados.get('km_final') and (not isinstance(dados['km_final'], (int, float)) or dados['km_final'] < dados['km_inicial']):
            return jsonify({'mensagem': 'KM final deve ser maior que KM inicial!'}), 400
        
        deslocamento = models.Deslocamento(
            origem=dados['origem'],
            destino=dados['destino'],
            km_inicial=dados['km_inicial'],
            km_final=dados.get('km_final'),
            distancia_percorrida=dados.get('distancia_percorrida'),
            data_inicio=datetime.fromisoformat(dados['data_inicio']) if dados.get('data_inicio') else datetime.utcnow(),
            data_fim=datetime.fromisoformat(dados['data_fim']) if dados.get('data_fim') else None
        )
        
        db_session.add(deslocamento)
        db_session.commit()
        
        return jsonify({
            'id': deslocamento.id,
            'mensagem': 'Deslocamento criado com sucesso!'
        }), 201

# Adicione esta rota para criar usuários
@app.route('/usuarios', methods=['POST'])
def criar_usuario():
    data = request.json
    
    # Validar campos obrigatórios
    if not all(field in data for field in ['nome', 'matricula', 'senha']):
        return jsonify({'mensagem': 'Campos obrigatórios ausentes!'}), 400
    
    db_session = next(get_db())
    
    # Verificar se usuário já existe
    usuario_existente = db_session.query(models.Usuario).filter_by(matricula=data['matricula']).first()
    if usuario_existente:
        return jsonify({'mensagem': 'Usuário com esta matrícula já existe!'}), 409
    
    # Criar novo usuário
    novo_usuario = models.Usuario(
        nome=data['nome'],
        matricula=data['matricula'],
        senha=data['senha']  # Em produção, aplique hash na senha
    )
    
    db_session.add(novo_usuario)
    db_session.commit()
    
    return jsonify({
        'id': novo_usuario.id,
        'nome': novo_usuario.nome,
        'matricula': novo_usuario.matricula,
        'mensagem': 'Usuário criado com sucesso!'
    }), 201

@app.route('/operacoes', methods=['GET', 'POST'])
@token_required
def handle_operacoes():
    db_session = next(get_db())
    
    if request.method == 'GET':
        operacoes = db_session.query(models.Operacao).all()
        print("Operacoes encontradas:", len(operacoes))  # Log para debug
        
        # Adicionar log para debug dos primeiros registros
        for op in operacoes[:2]:
            print(f"Operação ID: {op.id}")
            print(f"Temperatura: {op.temperatura}")
            print(f"Pressão: {op.pressao}")
            
        return jsonify([{
            'id': op.id,
            'inicio_operacao': op.inicio_operacao.isoformat() if op.inicio_operacao else None,
            'fim_operacao': op.fim_operacao.isoformat() if op.fim_operacao else None,
            'nome_op_aux': op.nome_op_aux,
            'tipo_operacao': op.tipo_operacao,
            'nome_cidade': op.nome_cidade,
            'nome_poco_serv': op.nome_poco_serv,
            'nome_operador': op.nome_operador,
            'volume_bbl': op.volume_bbl,
            'temperatura': float(op.temperatura) if op.temperatura is not None else 0,
            'pressao': float(op.pressao) if op.pressao is not None else 0,
            'descricao_atividades': op.descricao_atividades,
            'latitude': op.latitude,
            'longitude': op.longitude,
            'km_inicial': op.km_inicial,
            'km_final': op.km_final,
            'deslocamento_id': op.deslocamento_id,
            'mobilizacao_inicio': op.mobilizacao_inicio.isoformat() if op.mobilizacao_inicio else None,
            'mobilizacao_fim': op.mobilizacao_fim.isoformat() if op.mobilizacao_fim else None,
            'mobilizacao_status_inicio': op.mobilizacao_status_inicio,
            'mobilizacao_status_fim': op.mobilizacao_status_fim,
            'mobilizacao_duracao': op.mobilizacao_duracao
        } for op in operacoes])
    
    if request.method == 'POST':
        dados = request.get_json()
        print("Dados recebidos:", dados)  # Log para debug
        
        # Verificar se temos pelo menos os campos mínimos necessários
        if not dados:
            return jsonify({'mensagem': 'Nenhum dado foi enviado!'}), 400
            
        # Criar nova operação com campos adaptados do frontend
        try:
            operacao = models.Operacao(
                inicio_operacao=datetime.fromisoformat(f"{dados.get('data')}T{dados.get('horaInicio')}") if dados.get('data') and dados.get('horaInicio') else datetime.utcnow(),
                fim_operacao=datetime.fromisoformat(f"{dados.get('data')}T{dados.get('horaFim')}") if dados.get('data') and dados.get('horaFim') else None,
                nome_op_aux=dados.get('nomeAuxiliar', ''),  # Alterado para usar nomeAuxiliar
                tipo_operacao=dados.get('tipo', ''),
                nome_cidade=dados.get('cidade', ''),
                nome_poco_serv=dados.get('local', ''),
                nome_operador=dados.get('nomeOperador', ''),  # Alterado para usar nomeOperador
                volume_bbl=float(dados.get('volumeBbl', 0)),
                temperatura=float(dados.get('temperatura', 0)),
                pressao=float(dados.get('pressao', 0)),
                descricao_atividades=dados.get('observacoes', ''),  # Alterado para usar observacoes
                latitude=float(dados.get('latitude', 0)),
                longitude=float(dados.get('longitude', 0)),
                km_inicial=float(dados.get('km_inicial', 0)),
                km_final=float(dados.get('km_final', 0)),
                deslocamento_id=int(dados.get('deslocamentoId')) if dados.get('deslocamentoId') and dados.get('deslocamentoId').strip() else None,
                # Campos de mobilização
                mobilizacao_inicio=dados.get('mobilizacao_inicio'),
                mobilizacao_fim=dados.get('mobilizacao_fim'),
                mobilizacao_status_inicio=dados.get('mobilizacao_status_inicio'),
                mobilizacao_status_fim=dados.get('mobilizacao_status_fim'),
                mobilizacao_duracao=dados.get('mobilizacao_duracao')
            )
            
            db_session.add(operacao)
            db_session.commit()
            
            return jsonify({
                'id': operacao.id,
                'mensagem': 'Operação criada com sucesso!'
            }), 201
            
        except Exception as e:
            db_session.rollback()
            print(f"Erro ao salvar operação: {str(e)}")
            return jsonify({'mensagem': f'Erro ao salvar operação: {str(e)}'}), 500

# Adicione essa nova rota depois de todas as outras rotas existentes

@app.route('/relatorios/operacoes', methods=['GET'])
@token_required
def relatorio_operacoes():
    db_session = next(get_db())
    
    # Filtros opcionais
    data_inicio = request.args.get('data_inicio')
    data_fim = request.args.get('data_fim')
    tipo = request.args.get('tipo')
    
    # Construir a query com filtros
    query = db_session.query(models.Operacao)
    
    if data_inicio:
        data_inicio = datetime.fromisoformat(data_inicio)
        query = query.filter(models.Operacao.inicio_operacao >= data_inicio)
        
    if data_fim:
        data_fim = datetime.fromisoformat(data_fim)
        query = query.filter(models.Operacao.inicio_operacao <= data_fim)
        
    if tipo:
        query = query.filter(models.Operacao.tipo_operacao == tipo)
    
    # Executar a query
    operacoes = query.all()
    
    # Log para debug - exibe as primeiras operações
    for op in operacoes[:3]:
        print(f"Debug: Operação ID {op.id}, Temperatura: {op.temperatura}, Pressão: {op.pressao}")
    
    # Converter para formato JSON com todos os campos
    return jsonify([{
        'id': op.id,
        'inicio_operacao': op.inicio_operacao.isoformat() if op.inicio_operacao else None,
        'fim_operacao': op.fim_operacao.isoformat() if op.fim_operacao else None,
        'nome_op_aux': op.nome_op_aux,
        'tipo_operacao': op.tipo_operacao,
        'nome_cidade': op.nome_cidade,
        'nome_poco_serv': op.nome_poco_serv,
        'nome_operador': op.nome_operador,
        'volume_bbl': float(op.volume_bbl) if op.volume_bbl is not None else 0,
        'temperatura': float(op.temperatura) if op.temperatura is not None else 0,
        'pressao': float(op.pressao) if op.pressao is not None else 0,
        'descricao_atividades': op.descricao_atividades,
        'latitude': op.latitude,
        'longitude': op.longitude,
        'km_inicial': op.km_inicial,
        'km_final': op.km_final,
        'deslocamento_id': op.deslocamento_id,
        # Dados adicionais que podem estar faltando nos relatórios
        'auxiliar': op.nome_op_aux,
        'cidade': op.nome_cidade,
        'observacoes': op.descricao_atividades,
        # Formatação para exibição em relatório
        'data_formatada': op.inicio_operacao.strftime('%d/%m/%Y') if op.inicio_operacao else '',
        'hora_inicio': op.inicio_operacao.strftime('%H:%M') if op.inicio_operacao else '',
        'hora_fim': op.fim_operacao.strftime('%H:%M') if op.fim_operacao else '',
        'local': op.nome_poco_serv  # Mapeamento do campo 'local' do frontend
    } for op in operacoes])

@app.teardown_appcontext
def shutdown_session(exception=None):
    db.remove()

# Iniciar o servidor quando este arquivo for executado diretamente
if __name__ == '__main__':
    # Criar usuário padrão para testes se não existir
    with app.app_context():
        db_session = next(get_db())
        usuario_existente = db_session.query(models.Usuario).filter_by(matricula='admin').first()
        if not usuario_existente:
            novo_usuario = models.Usuario(
                nome='Administrador',
                matricula='admin',
                senha='admin'
            )
            db_session.add(novo_usuario)
            db_session.commit()
            print("Usuário padrão criado: matricula 'admin', senha 'admin'")
    
    app.run(debug=True, host='0.0.0.0', port=8000)