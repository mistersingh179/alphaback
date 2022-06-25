pragma solidity >=0.8.14;
//SPDX-License-Identifier: MIT

import "hardhat/console.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Multicall.sol";

contract Showcase is Ownable, Multicall {

    constructor(){
//        transferOwnership(0xF530CAb59d29c45d911E3AfB3B69e9EdB68bA283);
    }

    uint public defaultCost = 99990000000000000000 ; // this is $99.99 for USDC
    mapping(string => uint) public dayToCost;

    event PromotionAdded(Promotion promotion);

    struct Promotion {
        address promoter;
        address nftContractAddress;
        uint nftTokenId;
        string clickThruUrl;
        uint amount;
        string date;
        string title;
        string subTitle;
        string networkName;
        string imageUrl;
    }

    mapping(string => Promotion) public promotions;

    function getMultiplePromotions(string[] memory dates) public view returns(Promotion[] memory){
        uint numOfPromotions = dates.length;
        console.log("you asked for promotion count: ", numOfPromotions);
        Promotion[] memory promos = new Promotion[](numOfPromotions);
        for(uint i=0;i<numOfPromotions;i++){
            promos[i] = promotions[dates[i]];
            console.log(promos[i].promoter);
        }
        return promos;
   }

   function getMultipleDayCosts(string[] memory dates) public view returns(uint[] memory){
       uint numOfDates = dates.length;
       console.log("you asked for dates count: ", numOfDates);
       uint[] memory costs = new uint[](numOfDates);
       for(uint i=0;i<numOfDates;i++){
           costs[i] = dayToCost[dates[i]];
           console.log(costs[i]);
       }
       return costs;
   }

    // todo - charge USDC
    // todo - free for owner & our wallets
    function addPromotion(Promotion memory _promotion) public {
//        console.log(_promotion.promoter);
//        console.log(_promotion.nftContractAddress);
//        console.log(_promotion.nftTokenId);
//        console.log(_promotion.clickThruUrl);
//        console.log(_promotion.amount);
//        console.log(_promotion.date);
//        console.log(_promotion.title);
//        console.log(_promotion.subTitle);
//        console.log(_promotion.networkName);
        emit PromotionAdded(_promotion);
        promotions[_promotion.date] = _promotion;
//        console.log('added promotion');
//        console.log(_promotion.date);
//        console.log(promotions['_promotion.date']);
    }

    // to support receiving ETH by default
    receive() external payable {}
    fallback() external payable {}

    function setDefaultCost(uint newCost) public onlyOwner {
        defaultCost = newCost;
    }

    function setDayCost(string calldata date, uint newCost) public onlyOwner {
        dayToCost[date] = newCost;
    }

    // TODO
    // shutdown
    // owner withdraw
    // owner update
    // string date is is08601 format of YYYY-MM-DD

}
