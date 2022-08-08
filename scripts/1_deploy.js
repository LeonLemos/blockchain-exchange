const { ethers } = require("hardhat");

async function main() {
    // Fetch Contract to Deploy
    const Token = await ethers.getContractFactory("Token")

    // Deploy Contract
    const token = await Token.deploy() //Sending contract to the blockchain
    await token.deployed() //Get the information that was deployed 
    console.log(`Token Deployed to :${token.address}`)

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
