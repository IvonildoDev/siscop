from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import scoped_session, sessionmaker

# Configuração para MySQL
DATABASE_URL = "mysql+pymysql://root:@localhost/op"

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=3600,
    echo=False
)

# Esta é a sessão que você estava tentando importar como 'db'
db = scoped_session(
    sessionmaker(autocommit=False, autoflush=False, bind=engine)
)

Base = declarative_base()
Base.query = db.query_property()

def get_db():
    """
    Função para obter uma sessão de banco de dados
    """
    db_session = db()
    try:
        yield db_session
    finally:
        db_session.close()

def init_db():
    # Importa todos os modelos aqui para que sejam registrados com o Base
    import backend.models
    Base.metadata.create_all(bind=engine)