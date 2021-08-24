FROM node:12-alpine

# Create app directory
WORKDIR /server

# Install app dependencies
COPY package*.json ./

# Note that, rather than copying the entire working directory, we are only copying the package.json file.
# This allows us to take advantage of cached Docker layers
RUN npm install

# Bundle app source
COPY . .

EXPOSE 80

CMD [ "npm", "run", "start:prod" ]

HEALTHCHECK --interval=60s --timeout=5s CMD wget -nv -t1 --spider localhost/health || exit 1
