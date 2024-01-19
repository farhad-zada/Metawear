const { ethers, upgrades } = require("hardhat");
const hre = require("hardhat");

async function main() {
  const CryptoXRB = await ethers.getContractFactory(
    "CryptoXRB"
  );
  console.log("Deploying contract CryptoXRB...");
  const cryptoxrb = await upgrades.deployProxy(CryptoXRB, [], {
    initializer: "initialize",
    kind: "transparent",
  });
  console.log(
    `CryptoXRB Token deployed at address ${cryptoxrb.target}`
  );
  console.log("Waiting for contract to be mined...");
  await cryptoxrb.deploymentTransaction().wait(5);
  console.log("Contract mined by 5 blocks!");
}

main().catch((err) => {
  console.log(err);
  process.exitCode = 1;
});
