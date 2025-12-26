# Use official Node image
FROM node:latest


# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy app source code
COPY . .

# Expose port (change if your app uses another port)
EXPOSE 3000

# Start the app
CMD ["npm", "start"]
