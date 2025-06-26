# Stage 1: Build the Next.js application
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package.json and lock file first to leverage Docker cache
# This ensures npm install runs only if these files change
COPY package.json ./
COPY package-lock.json ./ 

# Install build dependencies
RUN npm install --frozen-lockfile # 

# Copy the rest of your application source code
COPY . .

# Run the Next.js build command
# This will create the .next directory with the production build
RUN npm run build # Or yarn build

# Stage 2: Create the final lean production image
FROM node:22-alpine

WORKDIR /app

# Copy ONLY the essential build output and runtime files from the builder stage

# 1. Copy the .next directory which contains the compiled application
COPY --from=builder /app/.next ./.next

# 2. Copy the public directory (for static assets like images, robots.txt)
#    Make sure you have a 'public' directory at your project root if you use it.
COPY --from=builder /app/public ./public

# 3. Copy package.json and lock file again for production dependencies
COPY package.json ./
COPY package-lock.json ./ 

# Install ONLY production dependencies (no devDependencies needed for runtime)
RUN npm install --production --frozen-lockfile # Or yarn install --production --frozen-lockfile

# Expose the default Next.js port. Cloud Run will use its PORT env var anyway.
EXPOSE 3000

# Command to run your Next.js application in production mode
# This relies on the 'start' script in your package.json
CMD ["npm", "start"]
# Alternatively, you could be more explicit, but 'npm start' is standard:
# CMD ["node", "node_modules/next/dist/bin/next", "start"]