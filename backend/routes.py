from flask import Blueprint, request, jsonify
from datetime import datetime
from database import get_db
import models
import jwt
from functools import wraps

# Chave secreta para JWT (em produção, use uma variável de ambiente)
SECRET_KEY = "sua-chave-secreta-aqui"

# Decorator para proteger rotas
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        # Obter token do cabeçalho
        auth_header = request.headers.get('Authorization')
        if auth_header:
            # Verificar se o formato é "Bearer <token>"
            parts = auth_header.split()
            if len(parts) == 2 and parts[0].lower() == 'bearer':
                token = parts[1]
        
        if not token:
            return jsonify({'mensagem': 'Token de autenticação ausente!'}), 401
        
        try:
            # Decodificar o token
            payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
            # Você pode adicionar o usuário à request para uso posterior
            request.current_user = payload
        except jwt.ExpiredSignatureError:
            return jsonify({'mensagem': 'Token expirado!'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'mensagem': 'Token inválido!'}), 401
            
        return f(*args, **kwargs)
    return decorated

# Criar o blueprint
routes = Blueprint('routes', __name__)

# Placeholder para outras rotas (ex.: operações)
@routes.route('/operacoes', methods=['GET'])
def get_operacoes():
    db_session = next(get_db())
    operacoes = db_session.query(models.Operacao).all()
    return jsonify([{
        'id': op.id,
        'tipo_operacao': op.tipo_operacao,
        'nome_cidade': op.nome_cidade,
        'inicio_operacao': op.inicio_operacao.isoformat()
    } for op in operacoes])

# Proteger a rota de deslocamentos
@routes.route('/deslocamentos', methods=['POST'])
@token_required
def criar_deslocamento():
    # Código para criar deslocamento
    dados = request.json
    # ...