async function main() {
  const initialSupply = 1000000; // adjust as needed
  const Token = await ethers.getContractFactory('DaviMotaToken');
  const token = await Token.deploy(initialSupply);
  await token.deployed();
  console.log('DaviMotaToken deployed to:', token.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
