import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract FooStorageV1 {
    uint public count;
    uint[49] __gap;
}

contract FooV1 is FooStorageV1, Initializable, UUPSUpgradeable, OwnableUpgradeable {

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(uint _count) initializer public {
        count = _count;
        __Ownable_init();
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
}

contract FooStorageV2 {
    uint public count;
    uint public average;
    uint[48] __gap;
}

contract FooV2 is FooStorageV2, Initializable, UUPSUpgradeable, OwnableUpgradeable {

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(uint _average) reinitializer(2) public {
        average = _average;
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
}

contract FooV3 is FooStorageV2, Initializable, UUPSUpgradeable, OwnableUpgradeable {

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize() reinitializer(3) public { }

    function incrementCount() public {
        count = count+1;
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
}


