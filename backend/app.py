from flask import Flask, Blueprint, request, jsonify
from flask_cors import CORS
from datetime import datetime, timedelta
import jwt
from database import db, Base, engine, get_db
import models
from routes import routes

# Chave secreta para JWT (em produção, use uma variável de ambiente)
SECRET_KEY = "sua-chave-secreta-aqui"

# Criar as tabelas no banco de dados
Base.metadata.create_all(bind=engine)

# Inicializar a aplicação Flask
app = Flask(__name__)
# Habilitar CORS para todas as rotas
CORS(app)
# Configuração do banco de dados
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///op.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Inicializar o db com o app
db.init_app(app)

# Registrar o blueprint de rotas
app.register_blueprint(routes)

# Middleware para validar JWT
def token_required(f):
    def decorator(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'mensagem': 'Token é necessário!'}), 401
        try:
            token = token.replace('Bearer ', '')
            data = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
            request.user = data['matricula']
        except jwt.ExpiredSignatureError:
            return jsonify({'mensagem': 'Token expirado!'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'mensagem': 'Token inválido!'}), 401
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
    dados = request.get_json()
    
    if not dados or not dados.get('matricula') or not dados.get('senha'):
        return jsonify({'mensagem': 'Credenciais incompletas!'}), 400
    
    # Simulação de verificação no banco (substitua por consulta real ao banco de dados)
    if dados.get('matricula') == '12345' and dados.get('senha') == 'senha123':
        # Gerar token JWT
        token = jwt.encode({
            'matricula': dados.get('matricula'),
            'exp': datetime.utcnow() + timedelta(hours=24)
        }, SECRET_KEY, algorithm="HS256")
        
        return jsonify({
            'token': token,
            'nome': 'Operador de Teste',
            'matricula': dados.get('matricula')
        })
    
    return jsonify({'mensagem': 'Matrícula ou senha incorretos!'}), 401

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

# Iniciar o servidor quando este arquivo for executado diretamente
if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=8000)