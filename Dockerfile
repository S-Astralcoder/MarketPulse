FROM python:3.12-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    tzdata \
    && rm -rf /var/lib/apt/lists/*

COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

WORKDIR /app

ENV UV_COMPILE_BYTECODE=1
ENV PORT=8000
ENV PATH="/app/.venv/bin:$PATH"

ENV CORN_JOB_SECOND=
ENV CORN_JOB_MINUTE=0
ENV CORN_JOB_HOUR=
ENV CORN_JOB_DAY=
ENV JWT_ALGO="HS256"
ENV JWT_EXPIRE_DAYS=30

COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev --no-install-project

COPY . .
RUN uv sync --frozen --no-dev

EXPOSE ${PORT}

CMD ["sh", "-c", "alembic upgrade head && python -m scripts.seed_stocks && exec uvicorn src.app:app --host 0.0.0.0 --port ${PORT}"]
