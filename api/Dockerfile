FROM python:3.11-slim AS base


# Create a non-root user and group
RUN groupadd -r bookzone_group && useradd -r -g bookzone_group -d /app -s /bin/bash bookzone_user

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
    pkg-config build-essential libpq-dev curl ca-certificates  \
    && pip install --no-cache-dir --upgrade pip \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt requirements.txt
RUN pip install --no-cache-dir --no-compile -r requirements.txt
COPY . .

RUN chmod +x Makefile
RUN chown -R bookzone_user:bookzone_group /app
USER bookzone_user

FROM base AS worker


FROM base AS development
EXPOSE 8000
CMD ["make", "dev"]

FROM base AS production
EXPOSE 8000
CMD ["make", "prod"]
