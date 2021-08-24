FROM keybaseio/client:nightly-node-slim

# Create server directory
RUN mkdir /server && chown keybase:keybase /server
WORKDIR /server

# Install app dependencies
COPY package*.json ./

# Note that, rather than copying the entire working directory, we are only copying the package.json file.
# This allows us to take advantage of cached Docker layers
RUN npm install

# Bundle app source
COPY . .

EXPOSE 80

CMD [ "npm", "run", "start" ]

HEALTHCHECK --interval=60s --timeout=5s CMD wget -nv -t1 --spider localhost/health || exit 1
