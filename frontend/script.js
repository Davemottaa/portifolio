/**
 * DAVI MOTA PORTFOLIO
 */

const TOKEN_CONTRACT_ADDRESS = '0x14dd4fa2ec111b5777e26c91bbcda31b7eb5ce9f';
const TOKEN_ABI = ['function claim()', 'function balanceOf(address) view returns (uint256)'];
const SEPOLIA_ID = 11155111n;

let provider, signer, userAddress, tokenContract;

document.addEventListener('DOMContentLoaded', () => {
    initUI();
    initWeb3Listeners();
});

// --- UI Logic ---
function initUI() {
    // Menu Mobile
    const mobileBtn = document.getElementById('mobile-menu-btn');
    const navList = document.getElementById('nav-list');
    
    if (mobileBtn) {
        mobileBtn.addEventListener('click', () => {
            navList.classList.toggle('active');
            const icon = mobileBtn.querySelector('i');
            icon.classList.toggle('fa-bars');
            icon.classList.toggle('fa-times');
        });
        
        // Fechar ao clicar
        document.querySelectorAll('.nav-list a').forEach(link => {
            link.addEventListener('click', () => {
                navList.classList.remove('active');
                mobileBtn.querySelector('i').classList.add('fa-bars');
                mobileBtn.querySelector('i').classList.remove('fa-times');
            });
        });
    }

    // Navbar Glass & Highlight
    const nav = document.querySelector('.glass-nav');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            nav.style.background = 'rgba(11, 11, 14, 0.95)';
            nav.style.padding = '10px 0';
        } else {
            nav.style.background = 'rgba(11, 11, 14, 0.7)';
            nav.style.padding = '15px 0';
        }
    });

    // Scroll Reveal
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('show');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.hidden').forEach(el => observer.observe(el));
    
}

// --- Web3 Logic ---
function initWeb3Listeners() {
    const connectBtn = document.getElementById('connect-wallet-btn');
    const claimBtn = document.getElementById('claim-btn');

    if (connectBtn) connectBtn.addEventListener('click', connectWallet);
    if (claimBtn) claimBtn.addEventListener('click', claimTokens);
}

async function connectWallet() {
    if (typeof window.ethereum === 'undefined') {
        alert('MetaMask not installed!');
        return;
    }

    const connectBtn = document.getElementById('connect-wallet-btn');
    connectBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Connecting...';

    try {
        provider = new ethers.BrowserProvider(window.ethereum);
        await provider.send("eth_requestAccounts", []);
        signer = await provider.getSigner();
        userAddress = await signer.getAddress();

        const network = await provider.getNetwork();
        if (network.chainId !== SEPOLIA_ID) {
            alert("Please switch to Sepolia Testnet");
            connectBtn.innerHTML = 'Connect Wallet';
            return;
        }

        tokenContract = new ethers.Contract(TOKEN_CONTRACT_ADDRESS, TOKEN_ABI, signer);
        
        // Update UI
        connectBtn.style.display = 'none';
        document.getElementById('wallet-actions').style.display = 'block';
        document.getElementById('user-address').innerText = `${userAddress.substring(0,6)}...${userAddress.substring(38)}`;
        
        updateBalance();

    } catch (err) {
        console.error(err);
        connectBtn.innerHTML = 'Connect Wallet';
    }
}

async function updateBalance() {
    try {
        const bal = await tokenContract.balanceOf(userAddress);
        document.getElementById('dmt-balance').innerText = ethers.formatUnits(bal, 18);
    } catch(e) {}
}

async function claimTokens() {
    const claimBtn = document.getElementById('claim-btn');
    const status = document.getElementById('tx-status');
    
    try {
        claimBtn.disabled = true;
        claimBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
        status.innerHTML = '<span style="color:#fcd34d">Confirm transaction in wallet...</span>';

        const tx = await tokenContract.claim();
        status.innerHTML = '<span style="color:#fcd34d">Transaction sent. Waiting...</span>';
        
        await tx.wait();
        
        status.innerHTML = '<span style="color:#00ff88">Success! 100 DMT sent.</span>';
        claimBtn.innerHTML = '<i class="fas fa-check"></i> Claimed';
        updateBalance();
        
        setTimeout(() => {
            claimBtn.disabled = false;
            claimBtn.innerHTML = '🎁 Claim Tokens';
            status.innerHTML = '';
        }, 5000);

    } catch (err) {
        console.error(err);
        claimBtn.disabled = false;
        claimBtn.innerHTML = '🎁 Claim Tokens';
        status.innerHTML = '<span style="color:#ff007a">Transaction failed.</span>';
    }
}

// Copy Utils
window.copyToClipboard = (id) => {
    navigator.clipboard.writeText(document.getElementById(id).innerText);
    const btn = document.querySelector(`button[onclick="copyToClipboard('${id}')"]`);
    btn.innerHTML = '<i class="fas fa-check" style="color: #00ff88"></i>';
    setTimeout(() => btn.innerHTML = '<i class="far fa-copy"></i>', 2000);
}

