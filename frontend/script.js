// Frontend script copied from project root (canonical)
// The full script logic is preserved here for serving from frontend/.
// ...existing content from root script.js...
// Mobile Menu Toggle
function toggleMenu() {
    const menu = document.getElementById('navMenu');
    menu.classList.toggle('active');
}

// Smooth Scroll
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            document.getElementById('navMenu').classList.remove('active');
        }
    });
});

// Scroll Animation
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, observerOptions);

document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));

// Active Nav Link
window.addEventListener('scroll', () => {
    let current = '';
    const sections = document.querySelectorAll('section');
    
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        if (scrollY >= (sectionTop - 200)) {
            current = section.getAttribute('id');
        }
    });

    document.querySelectorAll('nav a').forEach(link => {
        link.style.color = '';
        if (link.getAttribute('href') === `#${current}`) {
            link.style.color = 'var(--primary)';
        }
    });
});

// ============================================
// BLOCKCHAIN DONATION & FAUCET (ethers.js)
// ============================================

// Your Ethereum wallet address for donations
const WALLET_ADDRESS = '0x5168944c344bC9306AA804d31ebedfc1BD58F001';

// Token Contract Address (atualize para o seu deploy)
const TOKEN_CONTRACT_ADDRESS = '0x14dd4fa2ec111b5777e26c91bbcda31b7eb5ce9f';

// Minimal ABI para as chamadas que usamos
const TOKEN_ABI = [
    'function balanceOf(address) view returns (uint256)',
    'function faucetBalance() view returns (uint256)',
    'function lastClaimTime(address) view returns (uint256)',
    'function claim()'
];

let provider = null;
let signer = null;
let userAddress = null;
let tokenContract = null;

// Connect wallet for faucet using ethers.js
async function connectFaucetWallet() {
    if (typeof window.ethereum === 'undefined') {
        showFaucetStatus('Please install MetaMask or another Web3 wallet!', 'error');
        setTimeout(() => window.open('https://metamask.io/download/', '_blank'), 2000);
        return;
    }

    try {
        // Request account access
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        provider = new ethers.BrowserProvider(window.ethereum);
        signer = await provider.getSigner();
        userAddress = await signer.getAddress();

        // Check network (Sepolia chainId decimal = 11155111)
        const network = await provider.getNetwork();
        if (network.chainId !== 11155111) {
            showFaucetStatus('Please switch to Sepolia Testnet', 'error');
            await addSepoliaNetwork();
            return;
        }

        // Initialize contract with signer
        tokenContract = new ethers.Contract(TOKEN_CONTRACT_ADDRESS, TOKEN_ABI, provider);

        // Update UI
        document.getElementById('faucetStatusText').textContent = 'Wallet Connected ✓';
        document.getElementById('faucetWalletStatus').classList.add('connected');
        document.getElementById('connectFaucetWallet').style.display = 'none';
        document.getElementById('claimTokens').style.display = 'block';
        document.getElementById('faucetWalletInfo').style.display = 'block';
        document.getElementById('faucetConnectedAddress').textContent = userAddress;

        // Load balances
        await loadFaucetBalances();

        showFaucetStatus('Wallet connected successfully!', 'success');
    } catch (err) {
        console.error('Error connecting wallet:', err);
        showFaucetStatus('Failed to connect: ' + (err.message || err), 'error');
    }
}

// Load faucet and user balances using ethers
async function loadFaucetBalances() {
    try {
        if (!tokenContract) {
            // show placeholders
            document.getElementById('faucetBalance').textContent = '—';
            document.getElementById('userTokenBalance').textContent = '—';
            return;
        }

        // Read faucet balance and user balance
        const [faucetBal, userBal] = await Promise.all([
            tokenContract.faucetBalance().catch(() => null),
            tokenContract.balanceOf(userAddress).catch(() => null)
        ]);

        const decimals = 18;
        if (faucetBal !== null) {
            document.getElementById('faucetBalance').textContent = ethers.formatUnits(faucetBal, decimals) + ' DMT';
        } else {
            document.getElementById('faucetBalance').textContent = 'N/A';
        }

        if (userBal !== null) {
            document.getElementById('userTokenBalance').textContent = ethers.formatUnits(userBal, decimals);
        } else {
            document.getElementById('userTokenBalance').textContent = '0';
        }
    } catch (err) {
        console.error('Error loading balances:', err);
    }
}

// Claim tokens from faucet using signer
async function claimFaucetTokens() {
    if (!signer) {
        showFaucetStatus('Please connect your wallet first!', 'error');
        return;
    }

    if (!tokenContract) {
        showFaucetStatus('Contract not initialized', 'error');
        return;
    }

    try {
    showFaucetStatus('Processing claim... please confirm the transaction in your wallet', 'pending');

        const contractWithSigner = tokenContract.connect(signer);
        const tx = await contractWithSigner.claim();

    showFaucetStatus(`Tx sent: ${tx.hash.substring(0, 10)}... waiting for confirmation`, 'info');

        const receipt = await tx.wait();
        if (receipt.status === 1) {
            showFaucetStatus('🎉 Tokens claimed! Check your wallet.', 'success');
            // Reload balances
            setTimeout(loadFaucetBalances, 1500);
        } else {
            showFaucetStatus('Transaction failed', 'error');
        }
    } catch (err) {
        console.error('Error during claim:', err);
        if (err.code === 4001) {
            showFaucetStatus('Transaction rejected by the user', 'error');
        } else if (err.message && err.message.toLowerCase().includes('cooldown')) {
            showFaucetStatus('Please wait 24 hours between claims', 'error');
        } else {
            showFaucetStatus('Claim failed: ' + (err.message || err), 'error');
        }
    }
}

// Add Sepolia network to MetaMask (same as before)
async function addSepoliaNetwork() {
    if (!window.ethereum) return;
    try {
        await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
                chainId: '0xaa36a7',
                chainName: 'Sepolia Testnet',
                nativeCurrency: { name: 'Sepolia ETH', symbol: 'SEP', decimals: 18 },
                rpcUrls: ['https://sepolia.infura.io/v3/'],
                blockExplorerUrls: ['https://sepolia.etherscan.io/']
            }]
        });
        showFaucetStatus('Sepolia added! Please try connecting again.', 'success');
    } catch (err) {
        console.error('Error adding Sepolia:', err);
        showFaucetStatus('Failed to add Sepolia', 'error');
    }
}

// Show faucet status message
function showFaucetStatus(message, type) {
    const statusDiv = document.getElementById('faucetStatus');
    statusDiv.textContent = message;
    statusDiv.className = `faucet-status ${type}`;
    
    if (type === 'success' || type === 'error') {
        setTimeout(() => {
            statusDiv.textContent = '';
            statusDiv.className = 'faucet-status';
        }, 5000);
    }
}

// ============================================
// DONATION FUNCTIONALITY
// ============================================

// Open user's wallet with your address pre-filled
async function openWalletForDonation() {
    const statusDiv = document.getElementById('donationStatus');
    
    // Check if any Web3 wallet is available
    if (typeof window.ethereum !== 'undefined') {
        try {
            // Request account access
            const accounts = await window.ethereum.request({ 
                method: 'eth_requestAccounts' 
            });
            
            if (accounts.length > 0) {
                // Open transaction with pre-filled recipient address
                await window.ethereum.request({
                    method: 'eth_sendTransaction',
                    params: [{
                        from: accounts[0],
                        to: WALLET_ADDRESS,
                        value: '0x0', // User will input amount in their wallet
                    }],
                });
                
                showDonationStatus('Thank you! Transaction initiated 🙏', 'success');
            }
        } catch (error) {
            console.error('Wallet error:', error);
            
            if (error.code === 4001) {
                showDonationStatus('Transaction cancelled', 'info');
            } else if (error.code === -32002) {
                showDonationStatus('Please check your wallet - a connection request is pending', 'info');
            } else {
                showDonationStatus('Error: ' + error.message, 'info');
            }
        }
    } else {
        // No Web3 wallet detected
        showDonationStatus('No Web3 wallet detected. Please install MetaMask, Trust Wallet, or another Web3 wallet.', 'info');
        
        // Open MetaMask download page after 2 seconds
        setTimeout(() => {
            window.open('https://metamask.io/download/', '_blank');
        }, 2000);
    }
}

// Show donation status message
function showDonationStatus(message, type) {
    const statusDiv = document.getElementById('donationStatus');
    statusDiv.textContent = message;
    statusDiv.className = `donation-status ${type}`;
    
    setTimeout(() => {
        statusDiv.textContent = '';
        statusDiv.className = 'donation-status';
    }, 5000);
}

// Copy address from the main display
function copyMainAddress() {
    const address = WALLET_ADDRESS;
    
    navigator.clipboard.writeText(address).then(() => {
        showDonationStatus('✓ Address copied to clipboard!', 'success');
    }).catch(err => {
        console.error('Copy failed:', err);
        showDonationStatus('Failed to copy address', 'info');
    });
}

// Copy crypto address to clipboard
function copyAddress(inputId) {
    const input = document.getElementById(inputId);
    input.select();
    input.setSelectionRange(0, 99999);
    
    navigator.clipboard.writeText(input.value).then(() => {
        const notification = document.getElementById('copyNotification');
        notification.textContent = '✓ Address copied to clipboard!';
        notification.classList.add('show');
        
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }).catch(err => {
        alert('Failed to copy address');
        console.error('Copy failed:', err);
    });
}

// Generate QR Code for the wallet address
function generateQRCode() {
    const canvas = document.getElementById('qrCanvas');
    const size = 200;
    
    // Simple QR code generation using a library approach
    // For production, you'd want to use a proper QR library like qrcode.js
    // This is a placeholder that creates a styled canvas
    
    const ctx = canvas.getContext('2d');
    canvas.width = size;
    canvas.height = size;
    
    // Create a grid pattern (simplified QR representation)
    const blockSize = 10;
    const blocks = size / blockSize;
    
    // Fill background
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, size, size);
    
    // Create white blocks in a pattern
    ctx.fillStyle = '#FFFFFF';
    for (let i = 0; i < blocks; i++) {
        for (let j = 0; j < blocks; j++) {
            // Create a pseudo-random pattern based on the address
            const hash = WALLET_ADDRESS.charCodeAt(i % WALLET_ADDRESS.length) + 
                         WALLET_ADDRESS.charCodeAt(j % WALLET_ADDRESS.length);
            if (hash % 2 === 0) {
                ctx.fillRect(i * blockSize, j * blockSize, blockSize - 1, blockSize - 1);
            }
        }
    }
    
    // Add centered text
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('ETH', size / 2, size / 2);
    
    // Add note about using a real QR library
    console.log('Note: For production, integrate a proper QR code library like qrcode.js');
    console.log('Address to encode:', WALLET_ADDRESS);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    // Set up faucet buttons
    const connectFaucetBtn = document.getElementById('connectFaucetWallet');
    const claimBtn = document.getElementById('claimTokens');

    if (connectFaucetBtn) connectFaucetBtn.addEventListener('click', connectFaucetWallet);
    if (claimBtn) claimBtn.addEventListener('click', claimFaucetTokens);

    // Set up wallet button for donations
    const openWalletBtn = document.getElementById('openWallet');
    if (openWalletBtn) openWalletBtn.addEventListener('click', openWalletForDonation);

    // Generate QR code
    generateQRCode();

    // Listen for account and network changes
    if (typeof window.ethereum !== 'undefined') {
        window.ethereum.on('accountsChanged', (accounts) => {
            if (!accounts || accounts.length === 0) {
                // Disconnected
                userAddress = null;
                signer = null;
                provider = null;
                tokenContract = null;

                document.getElementById('faucetWalletStatus').classList.remove('connected');
                document.getElementById('faucetStatusText').textContent = 'Connect your wallet to claim tokens';
                document.getElementById('connectFaucetWallet').style.display = 'block';
                document.getElementById('claimTokens').style.display = 'none';
                document.getElementById('faucetWalletInfo').style.display = 'none';
            } else {
                // Account changed — reconnect
                connectFaucetWallet();
            }
        });

        window.ethereum.on('chainChanged', () => {
            // Reload to reset provider and network state
            window.location.reload();
        });

        // If already connected (e.g., page reload), attempt to connect
        window.ethereum.request({ method: 'eth_accounts' })
            .then(accounts => {
                if (accounts && accounts.length > 0) {
                    connectFaucetWallet();
                }
            })
            .catch(console.error);
    }
});
