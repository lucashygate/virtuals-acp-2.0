# Quick Deployment Checklist ✅

## Before You Start
- [ ] Have your OpenAI API key ready
- [ ] Code is pushed to GitHub/GitLab/Bitbucket
- [ ] Tested locally with `pnpm dev`

## Recommended: Deploy to Vercel (5 minutes)

### Step 1: Prepare
- [ ] Go to [vercel.com](https://vercel.com)
- [ ] Sign up with your GitHub account

### Step 2: Deploy
- [ ] Click "New Project"
- [ ] Import your repository
- [ ] Click "Deploy" (don't change any settings)

### Step 3: Add Environment Variables
- [ ] Go to Project Settings → Environment Variables
- [ ] Add: `OPENAI_API_KEY` = `your_actual_api_key`
- [ ] Redeploy (Vercel will prompt you)

### Step 4: Test
- [ ] Visit your app at `https://your-project.vercel.app`
- [ ] Test the Ethereum demo: `/demo-v2.html`
- [ ] Test the Polkadot demo: `/demo-polkadot.html`
- [ ] Try generating prompts to verify API works

## Alternative: Deploy to Netlify

### Quick Steps
- [ ] Go to [netlify.com](https://netlify.com)
- [ ] "Add new site" → Import from Git
- [ ] Choose your repo
- [ ] Site settings → Environment variables
- [ ] Add: `OPENAI_API_KEY` = `your_actual_api_key`
- [ ] Deploy

## ⚠️ Important Notes

- **Your OpenAI API key must be valid and have credits**
- **Never commit your API key to Git**
- **Test all demos after deployment**
- **Check deployment logs if something fails**

## 🎉 Success!

Your app should now be live and fully functional with:
- ✅ Working AI-powered transaction parsing
- ✅ Blockchain wallet integration  
- ✅ Multi-language prompt testing
- ✅ Automatic HTTPS
- ✅ Global CDN

## Need Help?

Check the full `DEPLOYMENT.md` guide for detailed instructions and troubleshooting. 