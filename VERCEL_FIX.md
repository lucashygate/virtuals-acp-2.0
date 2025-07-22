# 🔧 Fixing Your Vercel Deployment

## The Problem
Your Next.js app is in the `nl-tx-parser` subdirectory, but Vercel was trying to build from the repository root, causing 404 errors.

## The Fix

### Option 1: Update Existing Vercel Project (Recommended)

1. **Go to your Vercel project dashboard**
   - Visit: https://vercel.com/lucashygate/virtuals-acp-2-0

2. **Update Project Settings**
   - Go to: Settings → General
   - Find "Root Directory"
   - Change it to: `nl-tx-parser`
   - Click "Save"

3. **Add Environment Variable**
   - Go to: Settings → Environment Variables
   - Add:
     - Key: `OPENAI_API_KEY`
     - Value: `your-actual-openai-api-key`
   - Click "Save"

4. **Redeploy**
   - Go to: Deployments tab
   - Click the three dots on the latest deployment
   - Select "Redeploy"
   - Wait for build to complete

### Option 2: Deploy Fresh (If Option 1 Doesn't Work)

1. **Delete the current project in Vercel**
   - Settings → Advanced → Delete Project

2. **Create new deployment**
   ```bash
   # From your repository root
   cd nl-tx-parser
   npx vercel --prod
   ```

3. **When prompted:**
   - Set up and deploy: `Y`
   - Which scope: Choose your account
   - Link to existing project: `N`
   - What's your project's name: `nl-tx-parser` (or any name)
   - In which directory is your code located: `./` (since we cd'd into nl-tx-parser)
   - Want to modify settings: `N`

4. **Add environment variable**
   ```bash
   npx vercel env add OPENAI_API_KEY
   ```
   - Enter your OpenAI API key when prompted
   - Select all environments (Production, Preview, Development)

## What Changed

1. Created `vercel.json` in repository root with:
   ```json
   {
     "root": "nl-tx-parser"
   }
   ```
   This tells Vercel where your Next.js app is located.

## Verify Deployment Success

After redeployment, you should see in the build logs:
- "Detected Next.js"
- "Installing dependencies with pnpm"
- "Building application"
- Build time should be 1-2 minutes (not 38ms)

## Test Your App

Once deployed successfully:
1. Visit: `https://your-project.vercel.app/`
2. Test API: `https://your-project.vercel.app/demo-v2.html`
3. Click "Generate Test Prompts" to verify OpenAI integration works

## Still Getting 404?

If you still get 404 errors:
1. Check build logs for any errors
2. Ensure `OPENAI_API_KEY` is set correctly
3. Try Option 2 (fresh deployment)
4. Check that your GitHub repository has the latest changes

## Need More Help?

- Vercel Support: https://vercel.com/support
- Check build logs in Vercel dashboard
- Ensure all files are committed to Git 