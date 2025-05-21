FROM node:23 AS builder

WORKDIR /app

# Copy everything to builder
COPY . .

# Create a temp folder for filtered extensions
RUN mkdir -p filtered_extensions && \
    for ext in extensions/*; do \
      if [ -d "$ext/ui" ] && [ -f "$ext/manifest.json" ]; then \
        mkdir -p filtered_extensions/$(basename "$ext"); \
        cp "$ext/manifest.json" filtered_extensions/$(basename "$ext")/; \
        cp -r "$ext/ui" filtered_extensions/$(basename "$ext")/ui; \
      fi; \
    done

FROM node:23

WORKDIR /app

COPY ui ./ui
COPY --from=builder /app/filtered_extensions ./extensions

WORKDIR /app/ui

RUN npm install

CMD ["npm", "run", "dev"]

