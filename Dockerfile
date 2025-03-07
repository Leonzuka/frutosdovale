FROM python:3.9-slim

WORKDIR /app

# Instalar dependências do sistema necessárias para compilação
RUN apt-get update && apt-get install -y \
    build-essential \
    libssl-dev \
    libffi-dev \
    python3-dev \
    default-libmysqlclient-dev \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Copiar arquivos do projeto
COPY . /app/

# Instalar dependências Python
RUN pip install --no-cache-dir -r requirements.txt

# Configurar variáveis de ambiente
ENV FLASK_APP=app.py
ENV FLASK_ENV=production
ENV PORT=8080

# Expor a porta 8080
EXPOSE 8080

# Comando para iniciar a aplicação
CMD gunicorn --bind 0.0.0.0:$PORT wsgi:application