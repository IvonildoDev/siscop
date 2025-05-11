from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from database import Base
import datetime

class Deslocamento(Base):
    __tablename__ = "deslocamentos"

    id = Column(Integer, primary_key=True, index=True)
    origem = Column(String(255), nullable=False)
    destino = Column(String(255), nullable=False)
    km_inicial = Column(Float, nullable=False)
    km_final = Column(Float, nullable=True)
    distancia_percorrida = Column(Float, nullable=True)
    data_inicio = Column(DateTime, default=datetime.datetime.utcnow)
    data_fim = Column(DateTime, nullable=True)
    
    # Relacionamento com operações
    operacoes = relationship("Operacao", back_populates="deslocamento")
    
    # Timestamp de criação/atualização
    criado_em = Column(DateTime, default=datetime.datetime.utcnow)
    atualizado_em = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

class Operacao(Base):
    __tablename__ = "operacoes"

    id = Column(Integer, primary_key=True, index=True)
    inicio_operacao = Column(DateTime, default=datetime.datetime.utcnow)
    fim_operacao = Column(DateTime, nullable=True)
    nome_op_aux = Column(String(255), nullable=False)
    tipo_operacao = Column(String(255), nullable=False)
    nome_cidade = Column(String(255), nullable=False)
    nome_poco_serv = Column(String(255), nullable=False)
    nome_operador = Column(String(255), nullable=False)
    volume_bbl = Column(Float, nullable=False)
    temperatura = Column(Float, nullable=False)
    pressao = Column(Float, nullable=False)
    descricao_atividades = Column(Text, nullable=True)
    
    # Localização
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    
    # Quilometragem
    km_inicial = Column(Float, nullable=True)
    km_final = Column(Float, nullable=True)
    
    # Chave estrangeira para deslocamento
    deslocamento_id = Column(Integer, ForeignKey("deslocamentos.id"), nullable=True)
    deslocamento = relationship("Deslocamento", back_populates="operacoes")
    
    # Informações de mobilização
    mobilizacao_inicio = Column(DateTime, nullable=True)
    mobilizacao_fim = Column(DateTime, nullable=True)
    mobilizacao_status_inicio = Column(String(255), nullable=True)
    mobilizacao_status_fim = Column(String(255), nullable=True)
    mobilizacao_duracao = Column(Integer, nullable=True)  # duração em segundos
    
    # Timestamp de criação/atualização
    criado_em = Column(DateTime, default=datetime.datetime.utcnow)
    atualizado_em = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

class Usuario(Base):
    __tablename__ = 'usuarios'
    
    id = Column(Integer, primary_key=True)
    nome = Column(String(100), nullable=False)
    matricula = Column(String(20), nullable=False, unique=True)
    senha = Column(String(255), nullable=False)
    
    # Timestamp de criação/atualização (opcional)
    criado_em = Column(DateTime, default=datetime.datetime.utcnow)
    atualizado_em = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)