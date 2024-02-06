// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

contract Metawear is Initializable, ERC20Upgradeable, OwnableUpgradeable {
    mapping(address => bool) public admins;
    mapping(address => bool) public whitelist;
    uint256 public transferFeePercent;
    uint256 public remnant;
    uint256 public percentFloor;
    event Admin(address to, bool status);
    event Whitelist(address to, bool status);

    modifier isAdmin() {
        require(admins[msg.sender], "Metawear: not admin");
        _;
    }

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() initializer {}

    function initialize() public initializer {
        __ERC20_init("Metawear", "WEAR");
        __Ownable_init();
        admins[msg.sender] = true;
        whitelist[msg.sender] = true;
        transferFeePercent = 0;
        remnant = 10 ** 18; // 1.0
        percentFloor = 10 ** 18;
        _mint(msg.sender, 5_000_000_000 * 10 ** 18);
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override {
        super._beforeTokenTransfer(from, to, amount);
    }

    function _transfer(
        address from,
        address to,
        uint256 amount
    ) internal override {
        uint256 maxTransferrable = balanceOf(from) - remnant;

        amount = amount > maxTransferrable ? maxTransferrable : amount;

        if (transferFeePercent > 0 && !whitelist[from]) {
            uint256 fee = (amount * transferFeePercent) / percentFloor;
            super._transfer(from, address(this), fee);
            amount -= fee;
        }

        super._transfer(from, to, amount);
    }

    function burn(uint256 amount) public {
        _burn(msg.sender, amount);
    }

    function mint(address to, uint256 amount) public isAdmin {
        require(
            this.totalSupply() + amount <= 5_000_000_000 * 10 ** 18,
            "Metawear: max supply"
        );

        _mint(to, amount);
    }

    function setAdmin(address to, bool status) public onlyOwner {
        admins[to] = status;
        emit Admin(to, status);
    }

    function setTransferFeePercent(uint256 fee) public onlyOwner {
        transferFeePercent = fee;
    }

    function setWhitelistBatch(
        address[] memory _addresses,
        bool[] memory status
    ) public isAdmin {
        require(
            _addresses.length == status.length,
            "Metawear: length mismatch"
        );
        for (uint256 i = 0; i < _addresses.length; i++) {
            whitelist[_addresses[i]] = status[i];
            emit Whitelist(_addresses[i], status[i]);
        }
    }

    function setRemnant(uint256 _remnant) public onlyOwner {
        remnant = _remnant;
    }

    function setPercentFloor(uint256 _percentFloor) public onlyOwner {
        percentFloor = _percentFloor;
    }

    function withdraw(
        address token,
        address payable to,
        uint256 amount
    ) public payable onlyOwner returns (bool) {
        IERC20Upgradeable(token).transfer(to, amount);
        return true;
    }
}
