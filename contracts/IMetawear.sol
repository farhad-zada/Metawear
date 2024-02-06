// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

interface IMetawear {
    function name() external view returns (string memory);

    function symbol() external view returns (string memory);

    function decimals() external view returns (uint8);

    function totalSupply() external view returns (uint256);

    function balanceOf(address account) external view returns (uint256);

    function approve(address spender, uint256 amount) external returns (bool);

    function remnant() external view returns (uint256);

    function percentFloor() external view returns (uint256);

    function admins(address) external view returns (bool);

    function initialize() external;

    function burn(uint256 amount) external;

    function mint(address to, uint256 amount) external;

    function setAdmin(address to, bool status) external;

    function setTransferFeePercent(uint256 fee) external;

    function setRemnant(uint256 _remnant) external;

    function setPercentFloor(uint256 _percentFloor) external;

    function setWhitelistBatch(
        address[] memory _addresses,
        bool[] memory status
    ) external;

    function transfer(
        address recipient,
        uint256 amount
    ) external returns (bool);

    function allowance(
        address owner,
        address spender
    ) external view returns (uint256);

    function withdraw(
        address token,
        address payable to,
        uint256 amount
    ) external returns (bool);
}
