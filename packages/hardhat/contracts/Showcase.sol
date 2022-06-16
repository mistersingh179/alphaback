pragma solidity >=0.8.14;
//SPDX-License-Identifier: MIT

import "hardhat/console.sol";
// import "@openzeppelin/contracts/access/Ownable.sol";

contract Showcase {

    event PromotionAdded(Promotion promotion);

    struct Promotion {
        address promoter;
        address nftContractAddress;
        uint nftTokenId;
        string clickThruUrl;
        uint amount;
        string date;
    }

    mapping(string => Promotion) public promotions;

    constructor() payable {
        // what should we do on deploy??
    }

    function addPromotion(Promotion memory _promotion) public {
        console.log(_promotion.date);
        console.log(_promotion.nftContractAddress);
        console.log(_promotion.nftTokenId);
        console.log(_promotion.promoter);
        emit PromotionAdded(_promotion);
        promotions[_promotion.date] = _promotion;
        console.log('added promotion');
        console.log(_promotion.date);
//        console.log(promotions['_promotion.date']);

    }

    // to support receiving ETH by default
    receive() external payable {}
    fallback() external payable {}

    // TODO
    // shutdown
    // owner withdraw
    // owner update
    // string date is is08601 format of YYYY-MM-DD

}
