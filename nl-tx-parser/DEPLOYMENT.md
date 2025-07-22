# Deployment Guide for NL-TX-Parser

Your Next.js app has API routes that require server-side execution. Since you can't install Node.js on your server, you need **serverless deployment** platforms that handle the backend automatically.

## Prerequisites

- OpenAI API key (required for AI functionality)
- Git repository (for automated deployments)
- Your code pushed to GitHub/GitLab/Bitbucket

## 🚀 Recommended Options (No Node.js Installation Required)

### Option 1: Vercel (Best for Next.js + API Routes)

**Vercel is the company behind Next.js and provides the best experience for Next.js apps with API routes.**

#### Method A: Git Integration (Recommended)
1. Push your code to GitHub/GitLab/Bitbucket
2. Go to [vercel.com](https://vercel.com) and sign up
3. Click "New Project" → Import your repository
4. Vercel auto-detects Next.js configuration
5. **Add Environment Variables:**
   - Click "Environment Variables"
   - Add: `OPENAI_API_KEY` = `your_actual_openai_api_key`
6. Click "Deploy"
7. Your app will be live at `https://your-project.vercel.app`

#### Method B: CLI Deployment
```bash
# Install Vercel CLI
pnpm add -D vercel

# Deploy (follow prompts to set up project)
npx vercel

# Add environment variable
npx vercel env add OPENAI_API_KEY

# Deploy to production
npx vercel --prod
```

**✅ Advantages:**
- Perfect Next.js integration
- Automatic API route handling
- Free tier available
- Custom domains included
- Automatic HTTPS
- Preview deployments for PRs

### Option 2: Netlify (Good Alternative)

**Netlify supports Next.js with serverless functions.**

#### Method A: Git Integration
1. Push code to GitHub/GitLab/Bitbucket
2. Go to [netlify.com](https://netlify.com) and sign up
3. Click "Add new site" → "Import an existing project"
4. Choose your repository
5. Netlify will detect Next.js automatically
6. **Add Environment Variables:**
   - Go to Site settings → Environment variables
   - Add: `OPENAI_API_KEY` = `your_actual_openai_api_key`
7. Click "Deploy site"

#### Method B: CLI Deployment
```bash
# Install Netlify CLI
pnpm add -D netlify-cli

# Login and deploy
npx netlify login
npx netlify init
npx netlify env:set OPENAI_API_KEY your_actual_openai_api_key
npx netlify deploy --prod
```

**✅ Advantages:**
- Good Next.js support
- Free tier available
- Easy custom domains
- Form handling features

### Option 3: Railway (Developer-Friendly)

**Railway provides simple deployment with great developer experience.**

```bash
# Install Railway CLI
pnpm add -D @railway/cli

# Login and deploy
npx railway login
npx railway init
npx railway variables:set OPENAI_API_KEY=your_actual_openai_api_key
npx railway up
```

**✅ Advantages:**
- Simple deployment process
- Built-in database options
- Good for full-stack apps
- Automatic HTTPS

### Option 4: Render (Reliable Alternative)

1. Go to [render.com](https://render.com) and sign up
2. Click "New" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Build Command:** `pnpm install && pnpm build`
   - **Start Command:** `pnpm start`
   - **Environment Variables:** Add `OPENAI_API_KEY`
5. Click "Create Web Service"

## 🔧 Required Environment Variables

Your app needs these environment variables to work:

```env
OPENAI_API_KEY=sk-your-actual-openai-api-key-here
```

**Important:** Never commit your `.env` file to Git. Add it to `.gitignore`.

## 🧪 Testing Your Deployment

After deployment, test these endpoints:

1. **Main app:** `https://your-domain.com/`
2. **Ethereum demo:** `https://your-domain.com/demo-v2.html`
3. **Polkadot demo:** `https://your-domain.com/demo-polkadot.html`
4. **API health check:** Try generating prompts in the demos

## 🌐 Custom Domain Setup

Most platforms support custom domains:

### Vercel
1. Go to Project Settings → Domains
2. Add your domain
3. Update DNS records as shown
4. HTTPS is automatic

### Netlify
1. Go to Site Settings → Domain management
2. Add custom domain
3. Update DNS records
4. SSL certificate is automatic

## 🚨 Troubleshooting

### API Routes Not Working
- ✅ Ensure `OPENAI_API_KEY` environment variable is set
- ✅ Check deployment logs for errors
- ✅ Verify your OpenAI API key is valid and has credits

### Build Errors
```bash
# Clear cache and rebuild
rm -rf .next node_modules
pnpm install
pnpm build
```

### CORS Issues
- API routes should work automatically on the same domain
- If using external domain, check CORS configuration

### Environment Variable Issues
- Environment variables must be set in the deployment platform
- Use `NEXT_PUBLIC_` prefix only for client-side variables
- Server-side API keys should NOT have the `NEXT_PUBLIC_` prefix

## 📊 Monitoring and Analytics

### Vercel Analytics
- Enable in Vercel dashboard → Analytics
- Track page views and performance

### Netlify Analytics
- Enable in Site Settings → Analytics
- Monitor traffic and performance

## 💰 Cost Considerations

### Free Tiers
- **Vercel:** 100GB bandwidth, unlimited personal projects
- **Netlify:** 100GB bandwidth, 300 build minutes
- **Railway:** $5/month after free trial
- **Render:** Free tier with limitations

### OpenAI API Costs
- Your main cost will be OpenAI API usage
- Monitor usage in OpenAI dashboard
- Consider implementing rate limiting

## 🔄 Continuous Deployment

All recommended platforms support automatic deployment:

1. **Push to main branch** → Automatic deployment
2. **Pull requests** → Preview deployments (Vercel/Netlify)
3. **Environment variables** → Managed in platform dashboard

## 🎯 Recommended Deployment Flow

1. **Choose Vercel** (best Next.js support)
2. **Push code to GitHub**
3. **Connect to Vercel**
4. **Add OPENAI_API_KEY environment variable**
5. **Deploy and test**
6. **Add custom domain if needed**

## 📞 Getting Help

- **Vercel:** [vercel.com/docs](https://vercel.com/docs)
- **Netlify:** [docs.netlify.com](https://docs.netlify.com)
- **Next.js:** [nextjs.org/docs/deployment](https://nextjs.org/docs/deployment)

Your app will work exactly the same as locally, but hosted in the cloud with automatic scaling! 