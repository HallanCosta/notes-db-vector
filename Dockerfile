FROM python:3.11-slim

WORKDIR /app/server

# Copia apenas o requirements primeiro (para cache)
COPY server/requirements.txt .

# Instala dependências (será cacheado pelo Docker)
# Usando mirror chinês para evitar problemas de rede
RUN pip install --no-cache-dir -i https://pypi.tuna.tsinghua.edu.cn/simple -r requirements.txt

# Copia o código da aplicação
COPY server/ .

# Exposição da porta
EXPOSE 8000

# Comando para rodar o servidor
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
