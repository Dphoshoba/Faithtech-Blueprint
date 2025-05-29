# Faithtech Marketing Website

This is the marketing website for Faithtech, built with Next.js, TypeScript, and Tailwind CSS.

## Features

- Modern, responsive design
- Lead capture form
- SEO optimized
- Performance optimized
- Security headers
- TypeScript support
- ESLint configuration
- Tailwind CSS styling

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the development server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Project Structure

```
marketing-website/
├── src/
│   ├── pages/          # Next.js pages
│   ├── components/     # React components
│   └── styles/         # Global styles
├── public/            # Static assets
├── tailwind.config.js # Tailwind configuration
├── next.config.js     # Next.js configuration
└── tsconfig.json      # TypeScript configuration
```

## Deployment

The website is automatically deployed to AWS when changes are pushed to the main branch. The deployment process includes:

1. Building the Next.js application
2. Uploading static assets to S3
3. Deploying to CloudFront
4. Applying WAF rules
5. Setting up monitoring and alerts

## Contributing

1. Create a new branch for your feature
2. Make your changes
3. Submit a pull request

## License

Proprietary - All rights reserved 