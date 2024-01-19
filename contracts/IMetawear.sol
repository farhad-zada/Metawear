// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

interface IMetawear {
    function admins(address) external view returns (bool);

    function initialize() external;

    function burn(uint256 amount) external;

    function mint(address to, uint256 amount) external;

    function setAdmin(address to, bool status) external;

    function setWhitelistBatch(
        address[] memory _addresses,
        bool[] memory status
    ) external;

    function setTransferFeePercent(uint256 fee) external;

    function setRemnant(uint256 _remnant) external;

    function withdraw(
        address token,
        address payable to,
        uint256 amount
    ) external returns (bool);
}
