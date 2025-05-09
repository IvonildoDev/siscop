from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Criar a instância SQLAlchemy
db = SQLAlchemy()

# Define a base para modelos declarativos
Base = declarative_base()

# Configuração do SQLite - Alterado para op.db
SQLALCHEMY_DATABASE_URI = "sqlite:///op.db"
engine = create_engine(SQLALCHEMY_DATABASE_URI)

# Criação da sessão
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    """Função para obter uma sessão do banco de dados"""
    db_session = SessionLocal()
    try:
        yield db_session
    finally:
        db_session.close()