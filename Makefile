SHELL := /bin/bash

.PHONY: clean install run

install:
	@npm ci

run: install
	@npm run dev

# Remove local dependencies
clean:
	rm -rf node_modules


