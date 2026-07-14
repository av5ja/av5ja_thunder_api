FROM mcr.microsoft.com/devcontainers/base:dev-ubuntu22.04

RUN apt-get update \
  && DEBIAN_FRONTEND=noninteractive apt-get install --no-install-recommends -y direnv \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/*
