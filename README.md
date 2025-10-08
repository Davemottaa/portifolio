# DaviMotaToken (DMT) - Portfolio & Demo 🪙

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Tests](https://github.com/Davemottaa/portifolio/actions/workflows/test.yml/badge.svg)](https://github.com/Davemottaa/portifolio/actions/workflows/test.yml)
[![GitHub Pages](https://github.com/Davemottaa/portifolio/actions/workflows/deploy-pages.yml/badge.svg)](https://github.com/Davemottaa/portifolio/actions/workflows/deploy-pages.yml)

Este repositório contém meu portfólio profissional e um token demonstrativo chamado "Davi Mota Token (DMT)" na rede Sepolia. O projeto inclui um faucet com sistema de cooldown para distribuir tokens de teste.

## 🚀 Features

- **Smart Contract (DaviMotaToken)**:
  - Token ERC-20 personalizado
  - Sistema de faucet com cooldown
  - Funções administrativas protegidas
  - Testes completos com Hardhat
  - Deploy na rede Sepolia

- **Frontend**:
  - Interface responsiva moderna
  - Integração com MetaMask
  - Sistema de faucet interativo
  - Seção de doações em crypto
  - Portfolio profissional integrado

## 🛠️ Tecnologias

- Solidity ^0.8.20
- Hardhat
- Ethers.js
- HTML5/CSS3/JavaScript
- GitHub Actions

- `DaviMotaToken.sol` — Solidity token contract with a faucet (claim + cooldown).
 - `frontend/index.html`, `frontend/style.css`, `frontend/script.js` — frontend for the portfolio and faucet UI.
- `package.json` — project scripts and dev dependencies (Hardhat).

This project is intended as a demo. Do not use the included contract in production without a security review and an external audit.

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

1. Configure environment variables for your RPC provider and deployer private key (do not commit private keys):

```bash
export RPC_URL="https://sepolia.infura.io/v3/YOUR_INFURA_KEY"
export PRIVATE_KEY="0x..."
```

2. Example deploy script (in `scripts/deploy.js`):

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

After deployment, update `TOKEN_CONTRACT_ADDRESS` in `script.js` and optionally in `index.html` so the frontend points to your deployed contract.

## Frontend usage (faucet)

1. Serve `index.html` locally (for example, with `http-server` or Live Server) or open it directly in a browser.
2. Connect MetaMask and ensure you are on Sepolia Testnet.
3. Click "Connect Wallet" and then "Claim Tokens" to call the contract's `claim()` function.

Notes:

- `script.js` contains helper functions to connect MetaMask, add the Sepolia network, and call `claim()` using `ethers.js` and a minimal ABI.
- Replace the placeholder RPC URL in `addSepoliaNetwork()` with your full RPC endpoint (Infura/Alchemy) if required.

## Security & best practices

- Prefer OpenZeppelin Contracts (ERC20, Ownable, Pausable, ReentrancyGuard) for production contracts.
- Avoid holding large funds in a single key; use a multisig for admin operations.
- Add unit tests for critical flows: claim success, cooldown enforcement, refill/withdraw, ownership transfer.
- Consider adding `Pausable` to be able to pause the faucet in emergencies.
- Plan for an external audit before deploying to mainnet.

## Pre-deploy checklist

- [ ] Migrate the token to an OpenZeppelin-based ERC20 (if desired)
- [ ] Add and run automated tests
- [ ] Configure RPC keys and PRIVATE_KEY securely
- [ ] Verify contract address is set in the frontend (`script.js` and `index.html`)
- [ ] Review faucet limits and anti-bot protections if making it public

## Recommended next steps

- Migrate the token contract to OpenZeppelin ERC20 + Ownable and add ReentrancyGuard/Pausable.
- Keep the frontend using `ethers.js` + ABI for on-chain calls (balanceOf, faucetBalance, lastClaimTime).
- Add test scripts and CI workflows (GitHub Actions) to run `npx hardhat test` and `npx hardhat compile` on PRs.
- Update the README with the deployed contract address and instructions to add the token to MetaMask (address, decimals, symbol).

## Important files

- `DaviMotaToken.sol` — token + faucet contract
- `index.html`, `script.js`, `style.css` — frontend
- `package.json` — project scripts and dependencies

If you want me to implement improvements automatically (for example: create `hardhat.config.js`, migrate to OpenZeppelin, update `script.js` to use `ethers.js`, or add basic tests), tell me which option and I'll apply the changes in the workspace.

---

## GitHub Pages deployment

This repository includes a GitHub Actions workflow that publishes the static frontend in `frontend/` to GitHub Pages on each push to `main`.

How it works:
- The workflow `.github/workflows/deploy-pages.yml` checks out the repo and publishes the `frontend/` folder using `peaceiris/actions-gh-pages`.
- Pages will be served from the `gh-pages` branch created by the action.

To enable Pages on the repository (one-time in GitHub UI):
1. Go to the repository on GitHub → Settings → Pages.
2. Select `gh-pages` branch as the source (the action will create it on first run).
3. Save. After the workflow runs, your site will be available at the Pages URL shown in the settings.

Local preview:

```bash
npm install
npm run start
# open http://localhost:8080
```
