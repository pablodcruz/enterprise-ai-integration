FROM python:3.12-slim

RUN useradd --create-home --uid 10001 labuser
WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY lab03 ./lab03
COPY fixtures ./fixtures

USER labuser
EXPOSE 8000
CMD ["python", "-m", "lab03.server"]
