FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY lab03 ./lab03
COPY fixtures ./fixtures

# TODO: create a dedicated unprivileged user and switch to it before runtime.
# The final container must not run as uid 0.

EXPOSE 8000
CMD ["python", "-m", "lab03.server"]
