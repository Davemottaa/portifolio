# DaviMotaToken (DMT) - Portfolio & Demo 🪙

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Tests](https://github.com/Davemottaa/portifolio/actions/workflows/test.yml/badge.svg)](https://github.com/Davemottaa/portifolio/actions/workflows/test.yml)
[![GitHub Pages](https://github.com/Davemottaa/portifolio/actions/workflows/deploy-pages.yml/badge.svg)](https://github.com/Davemottaa/portifolio/actions/workflows/deploy-pages.yml)

This repository contains my professional portfolio and a demonstration token called **“Davi Mota Token (DMT)”** deployed on the Sepolia network.  
The project includes a faucet with a cooldown system to distribute test tokens.

## 🚀 Features

- **Smart Contract (DaviMotaToken)**:
  - Custom ERC-20 token  
  - Faucet system with cooldown  
  - Protected admin functions  
  - Full Hardhat testing  
  - Deployed on Sepolia testnet  

- **Frontend**:
  - Modern responsive interface  
  - MetaMask integration  
  - Interactive faucet system  
  - Crypto donation section  
  - Integrated professional portfolio  

## 🛠️ Technologies

- Solidity ^0.8.20  
- Hardhat  
- Ethers.js  
- HTML5 / CSS3 / JavaScript  
- GitHub Actions  

- `DaviMotaToken.sol` — Solidity token contract with faucet (claim + cooldown)  
- `frontend/index.html`, `frontend/style.css`, `frontend/script.js` — frontend for portfolio and faucet UI  
- `package.json` — project scripts and dev dependencies (Hardhat)  

This project is intended for demo purposes only.  
**Do not use the included contract in production without a security review or external audit.**

## Prerequisites

- Node.js v18 or newer  
- npm (or yarn)  

Optional: install `ethers` for local frontend tooling:

```bash
npm install ethers
```

## Hardhat — compile & test

To compile the Solidity contracts:

```bash
npx hardhat compile
```

Run tests (when added) with:

```bash
npx hardhat test
```

The included `hardhat.config.js` targets Solidity 0.8.20 and provides a sample Sepolia network configuration.

## Deploy (example using Hardhat)

1. Configure environment variables for your RPC provider and deployer private key (do **not** commit private keys):

```bash
export RPC_URL="https://sepolia.infura.io/v3/YOUR_INFURA_KEY"
export PRIVATE_KEY="0x..."
```

2. Example deploy script (`scripts/deploy.js`):

```js
async function main() {
  const initialSupply = 1000000; // adjust as needed
  const Token = await ethers.getContractFactory('DaviMotaToken');
  const token = await Token.deploy(initialSupply);
  await token.deployed();
  console.log('DaviMotaToken deployed to:', token.address);
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
```

3. Run the deploy script:

```bash
npx hardhat run scripts/deploy.js --network sepolia
```

After deployment, update `TOKEN_CONTRACT_ADDRESS` in `script.js` (and optionally in `index.html`) so the frontend points to your deployed contract.

## Frontend usage (faucet)

1. Serve `index.html` locally (using `http-server`, Live Server, etc.) or open it directly in a browser.  
2. Connect MetaMask and make sure you’re on the **Sepolia Testnet**.  
3. Click **"Connect Wallet"** and then **"Claim Tokens"** to call the contract’s `claim()` function.

Notes:
- `script.js` includes helper functions to connect MetaMask, add the Sepolia network, and call `claim()` using `ethers.js` and a minimal ABI.  
- Replace the placeholder RPC URL in `addSepoliaNetwork()` with your Infura or Alchemy endpoint if needed.  

## Security & Best Practices

- Use OpenZeppelin Contracts (`ERC20`, `Ownable`, `Pausable`, `ReentrancyGuard`) for production-grade tokens.  
- Avoid holding large funds with a single key — use multisig for admin operations.  
- Add unit tests for critical flows: claim success, cooldown enforcement, refill/withdraw, ownership transfer.  
- Consider adding `Pausable` to pause the faucet in case of emergency.  
- Plan for an external audit before deploying to mainnet.  

## Pre-deploy Checklist

- [ ] Migrate the token to an OpenZeppelin-based ERC20 (if desired)  
- [ ] Add and run automated tests  
- [ ] Configure RPC keys and PRIVATE_KEY securely  
- [ ] Verify the contract address in the frontend (`script.js` and `index.html`)  
- [ ] Review faucet limits and anti-bot measures before making it public  

## Recommended Next Steps

- Migrate the token contract to OpenZeppelin’s ERC20 + Ownable and add ReentrancyGuard/Pausable.  
- Keep the frontend using `ethers.js` + ABI for on-chain interactions (`balanceOf`, `faucetBalance`, `lastClaimTime`).  
- Add test scripts and CI workflows (GitHub Actions) to automatically run `npx hardhat test` and `npx hardhat compile` on PRs.  
- Update the README with your deployed contract address and instructions for adding the token to MetaMask (address, decimals, symbol).  

## Important Files

- `DaviMotaToken.sol` — token + faucet contract  
- `index.html`, `script.js`, `style.css` — frontend files  
- `package.json` — project scripts and dependencies  

If you’d like me to automatically implement improvements (for example: create `hardhat.config.js`, migrate to OpenZeppelin, update `script.js` to use `ethers.js`, or add basic tests), tell me which option you want and I’ll apply the changes in the workspace.

---

## GitHub Pages Deployment

This repository includes a GitHub Actions workflow that publishes the static frontend in `frontend/` to **GitHub Pages** on each push to the `main` branch.

**How it works:**
- The workflow `.github/workflows/deploy-pages.yml` checks out the repository and publishes the `frontend/` folder using `peaceiris/actions-gh-pages`.  
- Pages will be served from the `gh-pages` branch created by the workflow.

**To enable Pages (one-time setup in GitHub UI):**
1. Go to your repository → **Settings → Pages**.  
2. Select the `gh-pages` branch as the source (the action will create it on the first run).  
3. Save. Once the workflow runs, your site will be available at the Pages URL shown in the settings.  

**Local preview:**

```bash
npm install
npm run start
# open http://localhost:8080
```
