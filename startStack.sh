#!/bin/zsh

docker stack deploy -c <(docker-compose -f docker-stack.dev.yml config) stellot
