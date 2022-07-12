    pragma solidity >=0.8.0 <0.9.0;
    //SPDX-License-Identifier: MIT

    import "hardhat/console.sol";
    // import "@openzeppelin/contracts/access/Ownable.sol";
    // https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/access/Ownable.sol

    contract YourContract {

        event SetPurpose(address sender, string purpose);

        string public purpose = "Building Unstoppable Apps!!!";
        string[] public arr;

        constructor() payable {
        // what should we do on deploy?
        }

        function addMessage(string memory _message) public {
            arr.push(_message);
        }

        function getMessages() public view returns(string[] memory){
//            string[] memory result = new string[](arr.length);
//            for(uint i=0;i<arr.length;i++){
//                result[i] = arr[i];
//            }
//            return result;
            return arr;
        }

        function setPurpose(string memory newPurpose) public {
          purpose = newPurpose;
          console.log(msg.sender,"set purpose to",purpose);
          emit SetPurpose(msg.sender, purpose);
        }

        // to support receiving ETH by default
        receive() external payable {}
        fallback() external payable {}
    }
