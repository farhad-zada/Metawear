// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity 0.8.2;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract ERC20Mock is ERC20 {
    constructor() ERC20("Mock Token", "MCK") {}

    function mint(address to, uint256 amount) public {
        _mint(to, amount);
    }
}