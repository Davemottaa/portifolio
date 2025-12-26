/**
 * DAVI MOTA PORTFOLIO - MAIN SCRIPT
 * Stack: Vanilla JS + Ethers.js v6
 */

// --- Constants ---
const WALLET_ADDRESS = '0x5168944c344bC9306AA804d31ebedfc1BD58F001'; // Sua carteira pessoal
const TOKEN_CONTRACT_ADDRESS = '0x14dd4fa2ec111b5777e26c91bbcda31b7eb5ce9f'; // Seu contrato na Sepolia
const SEPOLIA_CHAIN_ID = '0xaa36a7'; // Chain ID Hex para Sepolia (11155111)

// ABI Mínima para interação com o contrato
const TOKEN_ABI = [
    'function balanceOf(address) view returns (uint256)',
    'function faucetBalance() view returns (uint256)',
    'function claim()'
];

// Estado Global Web3
let provider = null;
let signer = null;
let userAddress = null;
let tokenContract = null;

document.addEventListener('DOMContentLoaded', () => {
    initUI();
    initScrollEffects();
    initWeb3Listeners();
});

/* =========================================
   1. UI & UX INTERACTIONS
   ========================================= */

function initUI() {
    // Mobile Menu Toggle
    const mobileBtn = document.getElementById('mobile-menu-btn');
    const navList = document.getElementById('nav-list');
    
    if (mobileBtn) {
        mobileBtn.addEventListener('click', () => {
            navList.classList.toggle('active');
            const icon = mobileBtn.querySelector('i');
            
            // Alterna ícone entre Bars e Times (X)
            if (navList.classList.contains('active')) {
                icon.classList.remove('fa-bars');
                icon.classList.add('fa-times');
                document.body.style.overflow = 'hidden'; // Bloqueia scroll
            } else {
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
                document.body.style.overflow = 'auto'; // Libera scroll
            }
        });

        // Fecha menu ao clicar em link
        document.querySelectorAll('.nav-list a').forEach(link => {
            link.addEventListener('click', () => {
                navList.classList.remove('active');
                mobileBtn.querySelector('i').classList.remove('fa-times');
                mobileBtn.querySelector('i').classList.add('fa-bars');
                document.body.style.overflow = 'auto';
            });
        });
    }

    // Scroll Reveal Animation (Intersection Observer)
    const observerOptions = { threshold: 0.15, rootMargin: "0px 0px -50px 0px" };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('show');
                observer.unobserve(entry.target); // Anima apenas uma vez
            }
        });
    }, observerOptions);

    document.querySelectorAll('.hidden').forEach(el => observer.observe(el));
    
    // Gerar QR Code Estilizado (Canvas Mockup)
    generateStyledQRCode();
}

function initScrollEffects() {
    const nav = document.querySelector('.glass-nav');
    const sections = document.querySelectorAll('section');
    const navLinks = document.querySelectorAll('.nav-list a');

    window.addEventListener('scroll', () => {
        let current = '';
        const scrollY = window.scrollY;

        // 1. Navbar Glass Effect
        if (scrollY > 50) {
            nav.style.background = 'rgba(11, 11, 14, 0.95)';
            nav.style.padding = '10px 0';
            nav.style.boxShadow = '0 4px 20px rgba(0,0,0,0.4)';
        } else {
            nav.style.background = 'rgba(11, 11, 14, 0.7)';
            nav.style.padding = '15px 0';
            nav.style.boxShadow = 'none';
        }

        // 2. Active Link Highlighting
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            
            if (scrollY >= (sectionTop - 200)) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('nav-highlight');
            if (link.getAttribute('href').includes(current)) {
                link.classList.add('nav-highlight');
            }
        });
    });
}

// Utilitário para copiar texto
window.copyToClipboard = (elementId) => {
    const text = document.getElementById(elementId).innerText;
    navigator.clipboard.writeText(text).then(() => {
        // Feedback visual simples
        const btn = document.querySelector(`button[onclick="copyToClipboard('${elementId}')"]`);
        const originalIcon = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-check" style="color: #00ff88;"></i>';
        setTimeout(() => { btn.innerHTML = originalIcon; }, 2000);
    }).catch(err => console.error('Erro ao copiar:', err));
};

/* =========================================
   2. WEB3 & FAUCET LOGIC (Ethers v6)
   ========================================= */

function initWeb3Listeners() {
    const connectBtn = document.getElementById('connect-wallet-btn');
    const claimBtn = document.getElementById('claim-btn');

    if (connectBtn) connectBtn.addEventListener('click', connectWallet);
    if (claimBtn) claimBtn.addEventListener('click', claimTokens);
}

async function connectWallet() {
    if (typeof window.ethereum === 'undefined') {
        alert('MetaMask não detectada! Por favor instale para interagir.');
        window.open('https://metamask.io/download/', '_blank');
        return;
    }

    const connectBtn = document.getElementById('connect-wallet-btn');
    connectBtn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Connecting...';

    try {
        // 1. Conectar Carteira
        provider = new ethers.BrowserProvider(window.ethereum);
        await provider.send("eth_requestAccounts", []);
        signer = await provider.getSigner();
        userAddress = await signer.getAddress();

        // 2. Verificar Rede (Sepolia)
        const network = await provider.getNetwork();
        // Nota: ethers v6 retorna bigint para chainId
        if (network.chainId !== 11155111n) {
            try {
                await window.ethereum.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: SEPOLIA_CHAIN_ID }],
                });
                // Recarregar provider após troca de rede
                provider = new ethers.BrowserProvider(window.ethereum);
                signer = await provider.getSigner();
            } catch (switchError) {
                // Se a rede não existir, adicionar (código omitido para brevidade)
                alert("Por favor, mude para a rede Sepolia manualmente.");
                connectBtn.innerHTML = '<i class="fas fa-wallet"></i> Connect Wallet';
                return;
            }
        }

        // 3. Inicializar Contrato
        tokenContract = new ethers.Contract(TOKEN_CONTRACT_ADDRESS, TOKEN_ABI, signer);

        // 4. Atualizar UI
        updateConnectedUI();
        loadBalances();

    } catch (error) {
        console.error("Erro ao conectar:", error);
        connectBtn.innerHTML = '<i class="fas fa-exclamation-circle"></i> Error';
        setTimeout(() => connectBtn.innerHTML = '<i class="fas fa-wallet"></i> Connect Wallet', 2000);
    }
}

function updateConnectedUI() {
    document.getElementById('connect-wallet-btn').style.display = 'none';
    document.getElementById('wallet-actions').style.display = 'block';
    
    // Formatar endereço: 0x1234...5678
    const shortAddr = `${userAddress.substring(0, 6)}...${userAddress.substring(userAddress.length - 4)}`;
    document.getElementById('user-address').innerText = shortAddr;
    
    // Adicionar listener para mudança de conta
    window.ethereum.on('accountsChanged', () => window.location.reload());
    window.ethereum.on('chainChanged', () => window.location.reload());
}

async function loadBalances() {
    if (!tokenContract) return;
    
    try {
        const userBal = await tokenContract.balanceOf(userAddress);
        // Formata de Wei (18 decimais) para Ether/Token
        document.getElementById('dmt-balance').innerText = ethers.formatUnits(userBal, 18);
    } catch (err) {
        console.error("Erro ao ler saldo:", err);
    }
}

async function claimTokens() {
    const claimBtn = document.getElementById('claim-btn');
    const txStatus = document.getElementById('tx-status');
    
    try {
        claimBtn.disabled = true;
        claimBtn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Processing...';
        txStatus.innerHTML = '<span style="color: #fca5a5;">Aguardando confirmação na carteira...</span>';

        const tx = await tokenContract.claim();
        
        txStatus.innerHTML = '<span style="color: #fcd34d;">Transação enviada! Aguardando mineração...</span>';
        
        await tx.wait(); // Espera confirmação do bloco

        // Sucesso
        claimBtn.innerHTML = '<i class="fas fa-check"></i> Success!';
        claimBtn.style.background = '#00ff88';
        claimBtn.style.color = '#000';
        
        txStatus.innerHTML = '<span style="color: #00ff88;">Tokens recebidos com sucesso! 🎉</span>';
        
        // Atualiza saldo
        setTimeout(loadBalances, 2000);
        
        // Reset botão após 5s
        setTimeout(() => {
            claimBtn.disabled = false;
            claimBtn.innerHTML = '🎁 Claim Tokens';
            claimBtn.style = ''; // Remove inline styles
            txStatus.innerHTML = '';
        }, 5000);

    } catch (error) {
        console.error("Erro no claim:", error);
        claimBtn.disabled = false;
        claimBtn.innerHTML = '<i class="fas fa-times"></i> Failed';
        
        if (error.reason && error.reason.includes("cooldown")) {
            txStatus.innerHTML = '<span style="color: #ff007a;">Erro: Aguarde 24h entre os claims.</span>';
        } else {
            txStatus.innerHTML = '<span style="color: #ff007a;">Transação cancelada ou falhou.</span>';
        }
        
        setTimeout(() => {
            claimBtn.innerHTML = '🎁 Claim Tokens';
            txStatus.innerHTML = '';
        }, 3000);
    }
}

