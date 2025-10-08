const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("DaviMotaToken", function () {
  let token;
  let owner;
  let addr1;
  let addr2;
  const initialSupply = ethers.parseEther("1000000");

  beforeEach(async function () {
    // Get signers for testing
    [owner, addr1, addr2] = await ethers.getSigners();

    // Deploy token contract
    const Token = await ethers.getContractFactory("DaviMotaToken");
    token = await Token.deploy(initialSupply);
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await token.owner()).to.equal(owner.address);
    });

    it("Should assign the total supply to the contract", async function () {
      const contractBalance = await token.balanceOf(await token.getAddress());
      expect(await token.totalSupply()).to.equal(contractBalance);
    });

    it("Should set the correct initial values", async function () {
      expect(await token.name()).to.equal("Davi Mota Token");
      expect(await token.symbol()).to.equal("DMT");
      expect(await token.decimals()).to.equal(18);
      expect(await token.faucetAmount()).to.equal(ethers.parseEther("100"));
      expect(await token.cooldownTime()).to.equal(24 * 60 * 60); // 24 hours
    });
  });

  describe("Faucet Operations", function () {
    it("Should allow users to claim tokens", async function () {
      const initialBalance = await token.balanceOf(addr1.address);
      await token.connect(addr1).claim();
      const finalBalance = await token.balanceOf(addr1.address);
      expect(finalBalance - initialBalance).to.equal(await token.faucetAmount());
    });

    it("Should prevent claiming before cooldown period", async function () {
      await token.connect(addr1).claim();
      await expect(token.connect(addr1).claim()).to.be.revertedWith(
        "Cooldown period not passed yet"
      );
    });

    it("Should allow claiming after cooldown period", async function () {
      await token.connect(addr1).claim();
      await time.increase(24 * 60 * 60 + 1); // 24 hours + 1 second
      await token.connect(addr1).claim();
      const balance = await token.balanceOf(addr1.address);
      expect(balance).to.equal((await token.faucetAmount()) * BigInt(2));
    });

    it("Should prevent claims when faucet is empty", async function () {
      // Withdraw all tokens from faucet
      const faucetBalance = await token.faucetBalance();
      await token.connect(owner).withdrawFromFaucet(faucetBalance);
      
      await expect(token.connect(addr1).claim()).to.be.revertedWith(
        "Faucet is empty"
      );
    });
  });

  describe("Owner Operations", function () {
    it("Should allow owner to set faucet amount", async function () {
      const newAmount = ethers.parseEther("200");
      await token.connect(owner).setFaucetAmount(newAmount);
      expect(await token.faucetAmount()).to.equal(newAmount);
    });

    it("Should prevent non-owner from setting faucet amount", async function () {
      await expect(
        token.connect(addr1).setFaucetAmount(ethers.parseEther("200"))
      ).to.be.revertedWith("Only owner can call this function");
    });

    it("Should allow owner to set cooldown time", async function () {
      const newTime = 48 * 60 * 60; // 48 hours
      await token.connect(owner).setCooldownTime(newTime);
      expect(await token.cooldownTime()).to.equal(newTime);
    });

    it("Should allow owner to refill faucet", async function () {
      // First claim some tokens to reduce faucet balance
      await token.connect(addr1).claim();
      const initialFaucetBalance = await token.faucetBalance();
      
      // Owner gets some tokens first
      await token.connect(owner).withdrawFromFaucet(ethers.parseEther("1000"));
      
      // Then refills
      await token.connect(owner).refillFaucet(ethers.parseEther("500"));
      
      const finalFaucetBalance = await token.faucetBalance();
      expect(finalFaucetBalance).to.equal(
        initialFaucetBalance - ethers.parseEther("1000") + ethers.parseEther("500")
      );
    });
  });

  describe("Token Operations", function () {
    it("Should handle transfers correctly", async function () {
      // Owner withdraws some tokens first
      await token.connect(owner).withdrawFromFaucet(ethers.parseEther("1000"));
      
      // Then transfers to addr1
      await token.connect(owner).transfer(addr1.address, ethers.parseEther("500"));
      
      expect(await token.balanceOf(addr1.address)).to.equal(ethers.parseEther("500"));
    });

    it("Should handle allowances correctly", async function () {
      // Owner withdraws some tokens first
      await token.connect(owner).withdrawFromFaucet(ethers.parseEther("1000"));
      
      // Owner approves addr1 to spend tokens
      await token.connect(owner).approve(addr1.address, ethers.parseEther("500"));
      
      // addr1 transfers from owner to addr2
      await token.connect(addr1).transferFrom(
        owner.address,
        addr2.address,
        ethers.parseEther("300")
      );
      
      expect(await token.balanceOf(addr2.address)).to.equal(ethers.parseEther("300"));
      expect(await token.allowance(owner.address, addr1.address)).to.equal(ethers.parseEther("200"));
    });
  });

  describe("View Functions", function () {
    it("Should correctly report if user can claim", async function () {
      expect(await token.canClaim(addr1.address)).to.be.true;
      
      await token.connect(addr1).claim();
      expect(await token.canClaim(addr1.address)).to.be.false;
      
      await time.increase(24 * 60 * 60 + 1);
      expect(await token.canClaim(addr1.address)).to.be.true;
    });

    it("Should correctly report time until next claim", async function () {
      expect(await token.timeUntilNextClaim(addr1.address)).to.equal(0);
      
      await token.connect(addr1).claim();
      expect(await token.timeUntilNextClaim(addr1.address)).to.be.above(0);
      
      await time.increase(24 * 60 * 60 + 1);
      expect(await token.timeUntilNextClaim(addr1.address)).to.equal(0);
    });
  });
});