FROM postgres:16.10-trixie

WORKDIR /app

RUN apt-get update && apt-get install -y wget unzip && rm -rf /var/lib/apt/lists/*
COPY import.sh .